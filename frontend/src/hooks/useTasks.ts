import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, ApiRequestError } from '../lib/api';
import { computeWorkStatus } from '../lib/workStatus';
import type { AuditEntry, Category, Task, TaskDraft, TaskSummaryByCategory } from '../types';

const tasksKey = (category: Category) => ['tasks', category] as const;

export function useTasks(category: Category) {
  return useQuery({
    queryKey: tasksKey(category),
    queryFn: () => api.get<Task[]>(`/tasks?category=${category}`),
  });
}

export function useTaskSummary() {
  return useQuery({
    queryKey: ['tasks', 'summary'],
    queryFn: () => api.get<TaskSummaryByCategory>('/tasks/summary'),
  });
}

export function useTaskAudit(taskId: string | null) {
  return useQuery({
    queryKey: ['tasks', taskId, 'audit'],
    queryFn: () => api.get<AuditEntry[]>(`/tasks/${taskId}/audit`),
    enabled: !!taskId,
  });
}

function invalidateAfterWrite(queryClient: ReturnType<typeof useQueryClient>, category: Category) {
  queryClient.invalidateQueries({ queryKey: tasksKey(category) });
  queryClient.invalidateQueries({ queryKey: ['tasks', 'summary'] });
}

export function useCreateTask(category: Category) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: TaskDraft) => api.post<Task>('/tasks', draft),
    onSuccess: () => {
      invalidateAfterWrite(queryClient, category);
      toast.success('Task added');
    },
    onError: (err) => toast.error(err instanceof ApiRequestError ? err.message : 'Could not add task'),
  });
}

interface UpdateTaskVars {
  id: string;
  patch: Partial<Task>;
  /** Skip the success toast for silent saves like checkbox ticks and inline edits. */
  silent?: boolean;
}

export function useUpdateTask(category: Category) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: UpdateTaskVars) => api.patch<Task>(`/tasks/${id}`, patch),

    // Optimistic update: the spec calls for checkboxes that "save instantly",
    // so the UI applies the change to the cache immediately and rolls back
    // only if the server rejects it, rather than waiting on a round trip.
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: tasksKey(category) });
      const previous = queryClient.getQueryData<Task[]>(tasksKey(category));

      queryClient.setQueryData<Task[]>(tasksKey(category), (old) =>
        old?.map((t) => {
          if (t.id !== id) return t;
          const merged = { ...t, ...patch };
          return { ...merged, workStatus: computeWorkStatus(merged) };
        })
      );

      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(tasksKey(category), context.previous);
      toast.error(err instanceof ApiRequestError ? err.message : 'Could not save change');
    },
    onSuccess: (_data, vars) => {
      if (!vars.silent) toast.success('Saved');
    },
    onSettled: () => invalidateAfterWrite(queryClient, category),
  });
}

export function useDeleteTask(category: Category) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: tasksKey(category) });
      const previous = queryClient.getQueryData<Task[]>(tasksKey(category));
      queryClient.setQueryData<Task[]>(tasksKey(category), (old) => old?.filter((t) => t.id !== id));
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(tasksKey(category), context.previous);
      toast.error(err instanceof ApiRequestError ? err.message : 'Could not delete task');
    },
    onSuccess: () => toast.success('Task deleted'),
    onSettled: () => invalidateAfterWrite(queryClient, category),
  });
}
