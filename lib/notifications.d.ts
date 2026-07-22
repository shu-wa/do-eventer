import { EventItem } from '@/types/event';

export function requestNotificationPermission(): Promise<boolean>;
export function syncLocalReminders(events: EventItem[], enabled: boolean): Promise<number>;
