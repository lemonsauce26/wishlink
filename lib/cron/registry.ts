import { runEventReminders } from "./event-reminder";

// 새 크론 추가 시 이 맵에만 항목 추가
export const CRON_REGISTRY: Record<string, () => Promise<void>> = {
  event_reminder: runEventReminders,
};
