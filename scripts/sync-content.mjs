import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const meetupToken = process.env.MEETUP_TOKEN; // optional – needed if group is private
const meetupUrlname = process.env.MEETUP_URLNAME ?? 'brusergroups';
const sessionizeEventId = process.env.SESSIONIZE_EVENT_ID;
const sessionizeApiBase = process.env.SESSIONIZE_API_BASE ?? 'https://sessionize.com/api/v2';

const fallbackSite = {
  brand: 'BRSSUG',
  title: 'BRSSUG',
  description: 'Community talks, meetups, and speaker updates that stay synced from Meetup and Sessionize.',
  meetupUrl: 'https://www.meetup.com/',
  sessionizeUrl: 'https://sessionize.com/',
  lastSyncedAt: new Date().toISOString(),
  syncStatus: 'Seed data is active until API credentials are configured.'
};

async function readJson(relativePath, fallback) {
  try {
    const content = await readFile(path.join(rootDir, relativePath), 'utf8');
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

async function writeJson(relativePath, data) {
  const filePath = path.join(rootDir, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeMeetupEventGql(node, groupName, isPast) {
  const startsAt = node.dateTime ?? null;
  return {
    id: String(node.id ?? crypto.randomUUID()),
    title: node.title ?? 'Untitled event',
    url: node.eventUrl ?? `https://www.meetup.com/${meetupUrlname}/events/`,
    startsAt,
    summary: stripHtml(node.description) || 'See Meetup for event details.',
    organizer: groupName ?? 'BRSSUG',
    type: 'meetup',
    status: isPast ? 'past' : 'scheduled'
  };
}

function normalizeSpeaker(item) {
  return {
    id: String(item.id ?? item.name ?? crypto.randomUUID()),
    name: item.name ?? item.fullName ?? 'Unnamed speaker',
    tagline: item.tagLine ?? item.tagline ?? '',
    bio: item.bio ?? item.shortBio ?? '',
    profilePicture: item.profilePicture ?? item.profileImage ?? '',
    sessions: []
  };
}

function normalizeSession(item) {
  const speakers = Array.isArray(item.speakers) ? item.speakers : [];
  return {
    id: String(item.id ?? item.title ?? crypto.randomUUID()),
    title: item.title ?? 'Untitled session',
    description: stripHtml(item.description ?? item.shortDescription ?? ''),
    startsAt: item.startsAt ?? item.startDateTime ?? null,
    endsAt: item.endsAt ?? item.endDateTime ?? null,
    speakers: speakers.map((speaker) => speaker.name ?? speaker.fullName ?? speaker.id ?? '').filter(Boolean)
  };
}

async function fetchMeetupEvents() {
  if (!meetupToken) {
    return null; // no token → keep existing seed data
  }

  const query = `
    query($urlname: String!) {
      groupByUrlname(urlname: $urlname) {
        name
        upcomingEvents(input: { first: 5 }) {
          edges { node { id title eventUrl description dateTime } }
        }
        pastEvents(input: { first: 10 }) {
          edges { node { id title eventUrl description dateTime } }
        }
      }
    }
  `;

  const response = await fetch('https://api.meetup.com/gql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${meetupToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables: { urlname: meetupUrlname } })
  });

  if (!response.ok) {
    throw new Error(`Meetup API failed with ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors) {
    throw new Error(payload.errors.map((e) => e.message).join(', '));
  }

  const group = payload?.data?.groupByUrlname;
  if (!group) throw new Error('Group not found in Meetup API response');

  const upcoming = (group.upcomingEvents?.edges ?? []).map((e) =>
    normalizeMeetupEventGql(e.node, group.name, false)
  );
  const past = (group.pastEvents?.edges ?? []).map((e) =>
    normalizeMeetupEventGql(e.node, group.name, true)
  );

  return [...upcoming, ...past].filter((e) => e.title);
}

async function fetchSessionizeCollection(eventId, endpointNames) {
  if (!eventId) {
    return null;
  }

  for (const endpointName of endpointNames) {
    const response = await fetch(`${sessionizeApiBase}/${eventId}/view/${endpointName}`);

    if (!response.ok) {
      continue;
    }

    return response.json();
  }

  return null;
}

function extractArray(payload, keys) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  for (const key of keys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

async function fetchSessionizeData() {
  if (!sessionizeEventId) {
    return null;
  }

  const [speakerPayload, sessionPayload] = await Promise.all([
    fetchSessionizeCollection(sessionizeEventId, ['AllSpeakers', 'Speakers']),
    fetchSessionizeCollection(sessionizeEventId, ['AllSessions', 'Sessions'])
  ]);

  const speakerItems = extractArray(speakerPayload, ['speakers', 'data', 'items']);
  const sessionItems = extractArray(sessionPayload, ['sessions', 'data', 'items']);
  const speakers = speakerItems.map(normalizeSpeaker);
  const sessions = sessionItems.map(normalizeSession);
  const speakerMap = new Map(speakers.map((speaker) => [speaker.name.toLowerCase(), speaker]));

  for (const session of sessions) {
    for (const speakerName of session.speakers) {
      const speaker = speakerMap.get(speakerName.toLowerCase());

      if (!speaker) {
        continue;
      }

      speaker.sessions.push({
        title: session.title,
        startsAt: session.startsAt,
        eventTitle: 'Sessionize event'
      });
    }
  }

  return speakers;
}

async function main() {
  const currentSite = await readJson('src/data/generated/site.json', fallbackSite);
  const currentEvents = await readJson('src/data/generated/events.json', []);
  const currentSpeakers = await readJson('src/data/generated/speakers.json', []);

  let nextEvents = currentEvents;
  let nextSpeakers = currentSpeakers;
  const warnings = [];

  try {
    const meetupEvents = await fetchMeetupEvents();

    if (meetupEvents && meetupEvents.length > 0) {
      nextEvents = meetupEvents;
    }
  } catch (error) {
    warnings.push(`Meetup sync skipped: ${error.message}`);
  }

  try {
    const sessionizeSpeakers = await fetchSessionizeData();

    if (sessionizeSpeakers && sessionizeSpeakers.length > 0) {
      nextSpeakers = sessionizeSpeakers;
    }
  } catch (error) {
    warnings.push(`Sessionize sync skipped: ${error.message}`);
  }

  const nextSite = {
    ...currentSite,
    lastSyncedAt: new Date().toISOString(),
    syncStatus:
      warnings.length > 0
        ? `Sync completed with warnings: ${warnings.join(' | ')}`
        : 'Live API sync completed successfully.'
  };

  await writeJson('src/data/generated/site.json', nextSite);
  await writeJson('src/data/generated/events.json', nextEvents);
  await writeJson('src/data/generated/speakers.json', nextSpeakers);

  for (const warning of warnings) {
    console.warn(warning);
  }

  console.log(`Updated ${nextEvents.length} event(s) and ${nextSpeakers.length} speaker profile(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});