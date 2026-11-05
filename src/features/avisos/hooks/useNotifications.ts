import { useMemo } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLiveUpdates } from '@/lib/liveUpdates';
import { countUnread, listNotifications, markAllAsRead, markAsRead } from '../services/notificationsService';

/** RF-55: Realtime invalida las consultas; cada 30 s se consulta de respaldo. */
function useNotificationsLive(userId: string) {
  const watches = useMemo(
    () => [{ table: 'notifications' as const, filter: `user_id=eq.${userId}` }],
    [userId],
  );
  useLiveUpdates('notifications', userId, watches);
}

export function useUnreadCount(userId: string) {
  useNotificationsLive(userId);
  return useQuery({
    queryKey: ['notifications', userId, 'unread'],
    queryFn: () => countUnread(userId),
    refetchInterval: 30_000,
  });
}

export function useNotifications(userId: string, page: number, onlyUnread: boolean) {
  return useQuery({
    queryKey: ['notifications', userId, 'list', page, onlyUnread],
    queryFn: () => listNotifications(userId, page, onlyUnread),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

export function useMarkAsRead(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications', userId] }),
  });
}

export function useMarkAllAsRead(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => markAllAsRead(userId),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications', userId] }),
  });
}
