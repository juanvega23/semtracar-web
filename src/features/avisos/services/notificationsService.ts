import { supabase, type Tables } from '@/lib/supabase';

export const NOTIFICATIONS_PAGE_SIZE = 15;
export type Notification = Pick<
  Tables<'notifications'>,
  'id' | 'type' | 'title' | 'body' | 'link' | 'read_at' | 'created_at'
>;

export async function listNotifications(userId: string, page: number, onlyUnread: boolean) {
  let query = supabase
    .from('notifications')
    .select('id,type,title,body,link,read_at,created_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(page * NOTIFICATIONS_PAGE_SIZE, (page + 1) * NOTIFICATIONS_PAGE_SIZE - 1);
  if (onlyUnread) query = query.is('read_at', null);
  const { data, error, count } = await query;
  if (error) throw error;
  return { items: data, total: count ?? 0 };
}

export async function countUnread(userId: string): Promise<number> {
  const { error, count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) throw error;
  return count ?? 0;
}

export async function markAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null);
  if (error) throw error;
}

export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) throw error;
}

/** Texto del indicador de la campana: no crece más allá de dos caracteres. */
export function unreadBadge(count: number): string | null {
  if (count <= 0) return null;
  return count > 9 ? '9+' : String(count);
}
