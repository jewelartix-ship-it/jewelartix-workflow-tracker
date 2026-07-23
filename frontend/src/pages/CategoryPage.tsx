import { useMemo, useState } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { useAuth } from '../context/AuthContext';
import { DashboardCards } from '../components/dashboard/DashboardCards';
import { Toolbar } from '../components/table/Toolbar';
import { DataTable } from '../components/table/DataTable';
import { TaskModal } from '../components/modals/TaskModal';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import type { Category, Task, TaskDraft, WorkStatus } from '../types';
import { CATEGORY_LABELS } from '../lib/utils';

interface CategoryPageProps {
  category: Category;
}

export function CategoryPage({ category }: CategoryPageProps) {
  const { isAdmin } = useAuth();
  const { data: tasks, isLoading } = useTasks(category);
  const createTask = useCreateTask(category);
  const updateTask = useUpdateTask(category);
  const deleteTask = useDeleteTask(category);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkStatus | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; task?: Task } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const searched = useMemo(() => {
    if (!tasks) return [];
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) =>
      [t.sr, t.lot, t.fileName, t.note ?? '', t.reason ?? ''].some((field) => field.toLowerCase().includes(q))
    );
  }, [tasks, search]);

  const statusTabRows = useMemo(
    () => (statusFilter ? searched.filter((t) => t.workStatus === statusFilter) : searched),
    [searched, statusFilter]
  );

  const selectedTask =
    selectedIds.size === 1 ? (tasks ?? []).find((t) => t.id === [...selectedIds][0]) ?? null : null;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === statusTabRows.length ? new Set() : new Set(statusTabRows.map((t) => t.id))));
  }

  async function handleSave(draft: TaskDraft) {
    if (modal?.mode === 'edit' && modal.task) {
      await updateTask.mutateAsync({ id: modal.task.id, patch: draft });
    } else {
      await createTask.mutateAsync(draft);
    }
  }

  function handleDeleteSelected() {
    for (const id of selectedIds) deleteTask.mutate(id);
    setSelectedIds(new Set());
    setConfirmDelete(false);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-8 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{CATEGORY_LABELS[category]}</h1>

      <div className="mt-3 space-y-3 sm:mt-5 sm:space-y-5">
        <DashboardCards tasks={searched} activeFilter={statusFilter} onFilterChange={setStatusFilter} />

        <Toolbar
          isAdmin={isAdmin}
          onAdd={() => setModal({ mode: 'add' })}
          onEdit={() => selectedTask && setModal({ mode: 'edit', task: selectedTask })}
          onDelete={() => setConfirmDelete(true)}
          selectedCount={selectedIds.size}
          search={search}
          onSearchChange={setSearch}
        />

        {isLoading ? (
          <TableSkeleton />
        ) : (
          <DataTable
            tasks={statusTabRows}
            isAdmin={isAdmin}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onFieldEdit={(id, field, value) => updateTask.mutate({ id, patch: { [field]: value }, silent: true })}
            onProgressToggle={(id, field, value) =>
              updateTask.mutate({ id, patch: { [field]: value }, silent: true })
            }
            onCadDriveSave={(id, link) => updateTask.mutate({ id, patch: { cadDriveLink: link }, silent: true })}
            onCadDriveRemove={(id) => updateTask.mutate({ id, patch: { cadDriveLink: '' }, silent: true })}
            onRenderDriveSave={(id, link) => updateTask.mutate({ id, patch: { renderDriveLink: link }, silent: true })}
            onRenderDriveRemove={(id) => updateTask.mutate({ id, patch: { renderDriveLink: '' }, silent: true })}
            onRowDoubleClick={(task) => setModal({ mode: 'edit', task })}
            emptyMessage={
              search || statusFilter
                ? 'No tasks match your search or filter.'
                : `No ${CATEGORY_LABELS[category]} tasks yet. Click Add to create the first one.`
            }
          />
        )}
      </div>

      {modal && (
        <TaskModal
          category={category}
          task={modal.task}
          onClose={() => setModal(null)}
          onSave={handleSave}
          isSaving={createTask.isPending || updateTask.isPending}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={selectedIds.size > 1 ? `Delete ${selectedIds.size} tasks?` : 'Delete task?'}
          message="This removes it from the table. An admin can still recover it from the database if needed."
          confirmLabel="Delete"
          danger
          onConfirm={handleDeleteSelected}
          onCancel={() => setConfirmDelete(false)}
          isLoading={deleteTask.isPending}
        />
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-11 rounded-xl bg-surface-alt" />
      ))}
    </div>
  );
}
