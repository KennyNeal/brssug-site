import siteDataJson from '../data/generated/site.json';
import eventsJson from '../data/generated/events.json';
import speakersJson from '../data/generated/speakers.json';
import type { MeetupEvent, SiteData, Speaker } from './types';

export const siteData = siteDataJson as SiteData;
export const meetupEvents = eventsJson as MeetupEvent[];
export const speakers = speakersJson as Speaker[];