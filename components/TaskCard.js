import { useState } from 'react';
import { Calendar, Check, Copy, Edit, MapPin, Paperclip, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/reportUtils';

export function taskToText(task) {
  const contact = [task.name, task.phone, task.email].filter(Boolean).join(' | ');
  const lines = [
    `Task: ${task.task || ''}`,
    `Address: ${task.address || ''}`,
    contact && `Contact: ${contact}`,
    task.createdAt && `Date entered: ${formatDate(task.createdAt)}`,
    task.notes && `Notes: ${task.notes}`,
    task.attachments?.length > 0 && `Attachments: ${task.attachments.map(a => a.name).join(', ')}`,
  ];
  return lines.filter(Boolean).join('\n');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}

export default function TaskCard({ task, onEdit, onDelete, onToggleStatus }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (await copyText(taskToText(task))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const createdDate = task.createdAt
    ? new Date(task.createdAt).toLocaleDateString('en-CA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const statuses = [
    { field: 'ian', label: 'IAN', checked: task.ian, color: 'accent-blue-600' },
    { field: 'admin', label: 'ADMIN', checked: task.admin, color: 'accent-blue-600' },
    { field: 'steveM', label: 'STEVE M', checked: task.steveM, color: 'accent-blue-600' },
    { field: 'vendor', label: 'VENDOR', checked: task.vendor, color: 'accent-purple-600' },
    { field: 'done', label: 'DONE', checked: task.done, color: 'accent-green-600' },
  ];

  return (
    <div className={`task-row-grid w-full rounded-lg border px-4 py-3 shadow-sm transition-all ${
      task.done ? 'border-gray-200 bg-gray-50 opacity-75' : 'border-gray-300 bg-white'
    }`}>
      <a
        href={task.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}` : undefined}
        target={task.address ? '_blank' : undefined}
        rel={task.address ? 'noreferrer' : undefined}
        className={`flex min-w-0 items-center gap-2 text-sm ${
          task.address ? 'text-gray-600 hover:text-blue-600' : 'text-gray-400'
        }`}
        title={task.address || 'No address'}
      >
        <MapPin size={16} className="shrink-0" />
        <span className="truncate">{task.address || 'No address'}</span>
      </a>

      <div className="flex min-w-0 items-center gap-2" title={task.task}>
        <h3 className={`truncate font-bold ${task.done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
          {task.task}
        </h3>
        {task.attachments?.length > 0 && (
          <button
            onClick={() => onEdit(task)}
            className="flex shrink-0 items-center gap-0.5 text-xs text-gray-500 hover:text-brand-red"
            title={`${task.attachments.length} attachment${task.attachments.length > 1 ? 's' : ''}`}
            aria-label={`${task.attachments.length} attachments`}
          >
            <Paperclip size={14} /> {task.attachments.length}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-500">
        <Calendar size={14} className="shrink-0" />
        <span>{createdDate}</span>
      </div>

      <div className="flex items-center gap-3">
        {statuses.map(({ field, label, checked, color }) => (
          <label key={field} className="flex cursor-pointer items-center gap-1 text-xs font-bold text-gray-700">
            <input
              type="checkbox"
              checked={Boolean(checked)}
              onChange={(event) => onToggleStatus(task._id, field, event.target.checked)}
              aria-label={label}
              className={`h-4 w-4 rounded border-gray-300 ${color} focus:ring-2 focus:ring-offset-1`}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handleCopy}
          className={`rounded p-1.5 transition-colors ${copied ? 'text-green-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
          title={copied ? 'Copied!' : 'Copy task info'}
          aria-label="Copy task info"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
        <button
          onClick={() => onEdit(task)}
          className="rounded p-1.5 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
          title="Edit"
          aria-label="Edit task"
        >
          <Edit size={18} />
        </button>
        <button
          onClick={() => onDelete(task)}
          className="rounded p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          title="Delete"
          aria-label="Delete task"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
