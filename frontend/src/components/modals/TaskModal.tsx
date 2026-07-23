import { useState, type FormEvent } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ApiRequestError } from '../../lib/api';
import type { Category, Task, TaskDraft } from '../../types';
import { todayIso } from '../../lib/utils';

interface TaskModalProps {
  category: Category;
  task?: Task | null;
  onClose: () => void;
  onSave: (draft: TaskDraft) => Promise<unknown>;
  isSaving: boolean;
}

export function TaskModal({ category, task, onClose, onSave, isSaving }: TaskModalProps) {
  const isEdit = !!task;
  const [form, setForm] = useState<TaskDraft>({
    category,
    date: task?.date ?? todayIso(),
    sr: task?.sr ?? '',
    lot: task?.lot ?? '',
    fileName: task?.fileName ?? '',
    cadDriveLink: task?.cadDriveLink ?? '',
    renderDriveLink: task?.renderDriveLink ?? '',
    driveLink: task?.driveLink ?? '',
    note: task?.note ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function update<K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!form.sr.trim() || !form.lot.trim() || !form.fileName.trim() || !form.date) {
      setFormError('Please fill in every field under Basic Information.');
      return;
    }

    try {
      await onSave(form);
      onClose();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.details?.length) {
          const map: Record<string, string> = {};
          for (const d of err.details) map[d.path] = d.message;
          setFieldErrors(map);
        }
        setFormError(err.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Task' : 'Add Task'}
      onClose={onClose}
      width="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="task-form" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
            {formError}
          </div>
        )}

        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Basic Information
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input
                type="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
                className={inputClass}
                required
              />
            </Field>
            <Field label="SR" error={fieldErrors.sr}>
              <input
                type="text"
                value={form.sr}
                onChange={(e) => update('sr', e.target.value)}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Lot" error={fieldErrors.lot}>
              <input
                type="text"
                value={form.lot}
                onChange={(e) => update('lot', e.target.value)}
                className={inputClass}
                required
              />
            </Field>
            <Field label="File Name" error={fieldErrors.fileName}>
              <input
                type="text"
                value={form.fileName}
                onChange={(e) => update('fileName', e.target.value)}
                className={inputClass}
                required
              />
            </Field>
          </div>
        </fieldset>

        <Field label="CAD Drive Link" error={fieldErrors.cadDriveLink}>
          <input
            type="url"
            placeholder="https://drive.google.com/…"
            value={form.cadDriveLink ?? ''}
            onChange={(e) => update('cadDriveLink', e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Render Drive Link" error={fieldErrors.renderDriveLink}>
          <input
            type="url"
            placeholder="https://drive.google.com/…"
            value={form.renderDriveLink ?? ''}
            onChange={(e) => update('renderDriveLink', e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={form.note ?? ''}
            onChange={(e) => update('note', e.target.value)}
            rows={3}
            className={inputClass}
          />
        </Field>
      </form>
    </Modal>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent';
