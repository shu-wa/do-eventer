import { EventItem } from '@/types/event';

export async function requestNotificationPermission() {
  return false;
}

export async function syncLocalReminders(_events: EventItem[], _enabled: boolean) {
  return 0;
}
