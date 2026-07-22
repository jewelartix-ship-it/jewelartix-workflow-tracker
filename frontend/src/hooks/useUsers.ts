import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, ApiRequestError } from '../lib/api';
import type { RecentActivityEntry, Role, TeamMember } from '../types';

export function useTeamMembers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<TeamMember[]>('/users'),
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['audit', 'recent'],
    queryFn: () => api.get<RecentActivityEntry[]>('/audit/recent'),
  });
}

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserInput) => api.post<TeamMember>('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Team member added');
    },
    onError: (err) => toast.error(err instanceof ApiRequestError ? err.message : 'Could not add team member'),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<{ name: string; role: Role; active: boolean; password: string }> }) =>
      api.patch<TeamMember>(`/users/${id}`, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Team member updated');
    },
    onError: (err) => toast.error(err instanceof ApiRequestError ? err.message : 'Could not update team member'),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Team member deactivated');
    },
    onError: (err) => toast.error(err instanceof ApiRequestError ? err.message : 'Could not deactivate team member'),
  });
}

export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.patch('/users/me/password', data),
    onSuccess: () => toast.success('Password updated'),
    onError: (err) => toast.error(err instanceof ApiRequestError ? err.message : 'Could not update password'),
  });
}
