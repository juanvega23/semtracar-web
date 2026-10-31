import { useMutation, useQueryClient } from '@tanstack/react-query';
import { currentUserKey, type CurrentUser } from '@/features/acceso';
import { isNameTaken, updateProfile, type ProfileInput } from '../services/profileService';

export class NameTakenError extends Error {
  constructor() {
    super('Ya existe un usuario con ese nombre y apellido.');
    this.name = 'NameTakenError';
  }
}

export function useUpdateProfile(user: CurrentUser) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProfileInput) => {
      const nameChanged =
        input.name.toLowerCase() !== user.name.trim().toLowerCase() ||
        input.lastName.toLowerCase() !== user.lastName.trim().toLowerCase();
      if (nameChanged && (await isNameTaken(input.name, input.lastName))) throw new NameTakenError();
      await updateProfile(user.id, input);
      return input;
    },
    onSuccess: (input) => {
      queryClient.setQueryData<CurrentUser | null>(currentUserKey(user.id), (prev) =>
        prev
          ? {
              ...prev,
              name: input.name,
              lastName: input.lastName,
              address: input.address || null,
              phone: input.phone || null,
            }
          : prev,
      );
    },
  });
}
