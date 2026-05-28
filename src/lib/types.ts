export type SiteData = {
  brand: string;
  fullName: string;
  title: string;
  description: string;
  meetupUrl: string;
  sessionizeUrl: string;
  location: string;
  meetingSchedule: string;
  contactEmail: string;
  twitterUrl: string;
  blueskyUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  lastSyncedAt: string;
  syncStatus: string;
};

export type MeetupEvent = {
  id: string;
  title: string;
  url: string;
  startsAt: string | null;
  summary: string;
  organizer: string;
  type: 'meetup';
  status: string;
  recordingUrl?: string;
};

export type SpeakerSession = {
  title: string;
  startsAt: string | null;
  eventTitle: string;
};

export type Speaker = {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  profilePicture: string;
  sessions: SpeakerSession[];
};