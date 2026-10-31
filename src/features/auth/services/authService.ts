import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type RegisterInput = {
  name: string;
  lastName: string;
  email: string;
  password: string;
  address: string;
  phone: string;
};

export class DuplicateError extends Error {
  readonly field: 'email' | 'name';

  constructor(field: 'email' | 'name', message: string) {
    super(message);
    this.name = 'DuplicateError';
    this.field = field;
  }
}

/** RF-02: el correo no debe estar registrado. */
export async function isEmailRegistered(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_email_registered', { p_email: email });
  if (error) throw error;
  return data;
}

/** RF-03: nombre + apellido no duplicado. */
export async function isNameRegistered(name: string, lastName: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_name_registered', { p_name: name, p_last_name: lastName });
  if (error) throw error;
  return data;
}

/**
 * RF-01 a RF-04. La BD crea la fila en public.users y el casillero (trigger handle_new_user).
 * Supabase exige confirmar el correo, así que no hay sesión todavía: dirección y teléfono viajan
 * en los metadatos y se copian al perfil al iniciar sesión (syncPendingProfile en SessionProvider).
 */
export async function register(input: RegisterInput): Promise<void> {
  const [emailTaken, nameTaken] = await Promise.all([
    isEmailRegistered(input.email),
    isNameRegistered(input.name, input.lastName),
  ]);
  if (emailTaken) throw new DuplicateError('email', 'Este correo ya está registrado.');
  if (nameTaken) throw new DuplicateError('name', 'Ya existe un cliente con ese nombre y apellido.');

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
      data: {
        name: input.name,
        last_name: input.lastName,
        address: input.address,
        phone: input.phone,
      },
    },
  });
  if (error) throw error;

  // Supabase responde sin identidades cuando el correo ya existe en auth (igual que la app móvil).
  if (data.user && data.user.identities?.length === 0) {
    throw new DuplicateError('email', 'Este correo ya está registrado.');
  }
}

export async function signIn(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

/**
 * Copia dirección y teléfono del registro al perfil si aún están vacíos. Se llama con cada inicio de
 * sesión (también el automático del enlace de confirmación). Devuelve true si cambió algo.
 */
export async function syncPendingProfile(user: User): Promise<boolean> {
  const meta = user.user_metadata as { address?: string; phone?: string };
  if (!meta.address && !meta.phone) return false;

  const { data: profile } = await supabase
    .from('users')
    .select('address, phone')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile) return false;

  const patch: { address?: string; phone?: string } = {};
  if (!profile.address && meta.address) patch.address = meta.address;
  if (!profile.phone && meta.phone) patch.phone = meta.phone;
  if (Object.keys(patch).length === 0) return false;

  const { error } = await supabase.from('users').update(patch).eq('id', user.id);
  return !error;
}

/** RF-07 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** RF-06: envía el enlace para crear una contraseña nueva. */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(callback: (event: string, session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
  return () => data.subscription.unsubscribe();
}
