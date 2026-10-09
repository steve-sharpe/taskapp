import { useState, useEffect } from 'react';
import { Paperclip, X } from 'lucide-react';
import { formatFileSize, MAX_FILE_SIZE, MAX_FILES } from '@/lib/attachmentUtils';

export default function TaskForm({ task, existingTasks = [], onSave, onCancel }) {
  const [autofilled, setAutofilled] = useState(false);
  const [formData, setFormData] = useState({
    name: '', address: '', phone: '', email: '', task: '', notes: '', ian: false, admin: false, steveM: false, vendor: false, done: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({ ...task });
    }
  }, [task]);

  const normalizeAddress = (value) => (value || '').trim().replace(/\s+/g, ' ').toLowerCase();

  const knownAddresses = [...new Set(existingTasks.map(t => (t.address || '').trim()).filter(Boolean))];

  const autofillFromAddress = (address) => {
    const key = normalizeAddress(address);
    if (!key) return;
    const match = existingTasks
      .filter(t => normalizeAddress(t.address) === key && (t.name || t.phone || t.email))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    if (!match) return;

    const filled = {};
    ['name', 'phone', 'email'].forEach(field => {
      if (!formData[field] && match[field]) filled[field] = match[field];
    });
    if (Object.keys(filled).length === 0) return;
    setFormData(prev => ({ ...prev, ...filled }));
    setAutofilled(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'address') {
      setAutofilled(false);
      if (!task) autofillFromAddress(value);
    }
  };

  const handleFilesPicked = (e) => {
    const picked = Array.from(e.target.files);
    e.target.value = '';
    const oversized = picked.find(f => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setFileError(`"${oversized.name}" is larger than ${MAX_FILE_SIZE / 1024 / 1024} MB.`);
      return;
    }
    const existingCount = (formData.attachments || []).filter(a => !removedIds.includes(a.id)).length;
    if (existingCount + newFiles.length + picked.length > MAX_FILES) {
      setFileError(`A task can have at most ${MAX_FILES} attachments.`);
      return;
    }
    setFileError('');
    setNewFiles(prev => [...prev, ...picked]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData, { files: newFiles, removedIds });
    setIsSaving(false);
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const keptAttachments = (formData.attachments || []).filter(a => !removedIds.includes(a.id));

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6" onKeyDown={handleKeyDown}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">{task ? 'Edit Task' : 'Add New Task'}</h2>
            <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500" tabIndex="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" name="address" list="known-addresses" autoComplete="off" value={formData.address} onChange={handleChange} onBlur={(e) => { if (!task) autofillFromAddress(e.target.value); }} className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500" tabIndex="2" />
              <datalist id="known-addresses">
                {knownAddresses.map(a => <option key={a} value={a} />)}
              </datalist>
              {autofilled && <p className="mt-1 text-xs text-gray-500">Contact details filled in from an existing task at this address.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500" tabIndex="3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500" tabIndex="4" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Task / Request *</label>
            <input type="text" name="task" required value={formData.task} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 text-lg font-medium focus:ring-2 focus:ring-blue-500" tabIndex="5" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Ctrl+Enter to save)</label>
            <textarea name="notes" rows="4" value={formData.notes} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500" tabIndex="6" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
            {(keptAttachments.length > 0 || newFiles.length > 0) && (
              <ul className="mb-2 divide-y divide-gray-100 rounded border border-gray-200">
                {keptAttachments.map(a => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <a href={`/api/attachments/${a.id}`} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 text-gray-700 hover:text-brand-red">
                      <Paperclip size={14} className="shrink-0" />
                      <span className="truncate">{a.name}</span>
                      <span className="shrink-0 text-xs text-gray-400">{formatFileSize(a.size)}</span>
                    </a>
                    <button type="button" onClick={() => setRemovedIds(prev => [...prev, a.id])} className="text-gray-400 hover:text-red-600" aria-label={`Remove ${a.name}`}>
                      <X size={16} />
                    </button>
                  </li>
                ))}
                {newFiles.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-gray-700">
                      <Paperclip size={14} className="shrink-0" />
                      <span className="truncate">{f.name}</span>
                      <span className="shrink-0 text-xs text-gray-400">{formatFileSize(f.size)} · will upload on save</span>
                    </span>
                    <button type="button" onClick={() => setNewFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-600" aria-label={`Remove ${f.name}`}>
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Paperclip size={16} /> Add files
              <input type="file" multiple onChange={handleFilesPicked} className="sr-only" />
            </label>
            <span className="ml-3 text-xs text-gray-400">Up to {MAX_FILES} files, {MAX_FILE_SIZE / 1024 / 1024} MB each</span>
            {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}
          </div>

          <div className="flex flex-wrap gap-6 mb-6 p-4 bg-gray-50 rounded border border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="ian" checked={formData.ian} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" tabIndex="7" />
              <span className="font-medium text-gray-700">Ian</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="admin" checked={Boolean(formData.admin)} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              <span className="font-medium text-gray-700">Admin</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="steveM" checked={Boolean(formData.steveM)} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              <span className="font-medium text-gray-700">Steve M</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="vendor" checked={formData.vendor} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" tabIndex="8" />
              <span className="font-medium text-gray-700">Vendor</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer ml-auto">
              <input type="checkbox" name="done" checked={formData.done} onChange={handleChange} className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500" tabIndex="9" />
              <span className="font-medium text-gray-700">Done</span>
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50" tabIndex="11">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-6 py-2 bg-brand-red text-white rounded font-medium hover:bg-brand-red-dark disabled:opacity-50" tabIndex="10">
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}