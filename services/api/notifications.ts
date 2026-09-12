import { ApiError, request } from './client';

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string | null;
}

export interface NotificationsPayload {
  notifications: AppNotification[];
  unreadCount: number;
}

export async function fetchNotifications(
  token: string,
  signal?: AbortSignal
): Promise<NotificationsPayload> {
  const payload = await request<{
    success?: boolean;
    notifications?: AppNotification[];
    unreadCount?: number;
    error?: string;
  }>('/api/notifications', { token, signal });

  if (!payload.success) {
    throw new ApiError('http', 'notifications failed', 400, payload.error);
  }

  return {
    notifications: (payload.notifications ?? []).map((item) => ({
      ...item,
      isRead: Boolean(item.isRead),
      message: item.message ?? null,
      link: item.link ?? null,
      createdAt: item.createdAt ?? null,
    })),
    unreadCount: Number(payload.unreadCount ?? 0),
  };
}

export async function markNotificationsRead(input: {
  token: string;
  notificationIds?: number[];
  markAllAsRead?: boolean;
}): Promise<void> {
  const payload = await request<{ success?: boolean; error?: string }>('/api/notifications', {
    method: 'POST',
    token: input.token,
    body: {
      notificationIds: input.notificationIds,
      markAllAsRead: input.markAllAsRead,
    },
  });
  if (!payload.success) {
    throw new ApiError('http', 'mark read failed', 400, payload.error);
  }
}
