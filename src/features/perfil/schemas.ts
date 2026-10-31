import { z } from 'zod';
import { personNameSchema, phoneSchema } from '@/features/auth';

export const profileSchema = z.object({
  name: personNameSchema('nombre'),
  lastName: personNameSchema('apellido'),
  address: z.string().trim().max(250, 'La dirección es demasiado larga.'),
  phone: z.union([z.literal(''), phoneSchema]),
});

export type ProfileFormValues = z.input<typeof profileSchema>;
export type ProfileValues = z.output<typeof profileSchema>;
