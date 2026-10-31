import { supabase } from '@/lib/supabase';

export type ProfileInput = {
  name: string;
  lastName: string;
  address: string;
  phone: string;
};

/** RF-08 / RF-50: actualiza los datos del propio usuario. Rol y casillero no se pueden cambiar (trigger en BD). */
export async function updateProfile(userId: string, input: ProfileInput): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      name: input.name,
      last_name: input.lastName,
      address: input.address || null,
      phone: input.phone || null,
    })
    .eq('id', userId);
  if (error) throw error;
}

/** RF-03 también al editar: nombre + apellido no duplicado. */
export async function isNameTaken(name: string, lastName: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_name_registered', { p_name: name, p_last_name: lastName });
  if (error) throw error;
  return data;
}
