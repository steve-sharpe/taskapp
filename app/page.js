"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUp, BarChart3, Plus, Search } from 'lucide-react';
import DashboardStats from '@/components/DashboardStats';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filter, setFilter] = useState('OPEN');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('address-asc');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  const toggleSort = (field) => {
    const ascending = field === 'address' ? 'address-asc' : 'oldest';
    const descending = field === 'address' ? 'address-desc' : 'newest';
    setSortBy(current => current === ascending ? descending : ascending);
  };

  // Fetch Data
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to load tasks');
      const data = await res.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError("Unable to load tasks. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Save Task (Create or Update)
  const handleSaveTask = async (taskData, { files = [], removedIds = [] } = {}) => {
    try {
      const isEdit = !!taskData._id;
      const url = isEdit ? `/api/tasks/${taskData._id}` : '/api/tasks';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (!res.ok) throw new Error('Failed to save task');
      
      let savedTask = await res.json();
      let attachmentError = null;

      try {
        for (const fileId of removedIds) {
          const delRes = await fetch(`/api/attachments/${fileId}`, { method: 'DELETE' });
          if (!delRes.ok) throw new Error('Failed to remove attachment');
          savedTask = await delRes.json();
        }
        for (const file of files) {
          const body = new FormData();
          body.append('files', file);
          const upRes = await fetch(`/api/tasks/${savedTask._id}/attachments`, { method: 'POST', body });
          if (!upRes.ok) throw new Error((await upRes.json().catch(() => ({}))).error || `Failed to upload ${file.name}`);
          savedTask = await upRes.json();
        }
      } catch (err) {
        attachmentError = err.message;
      }

      if (isEdit) {
        setTasks(current => current.map(t => t._id === savedTask._id ? savedTask : t));
      } else {
        setTasks(current => [savedTask, ...current]);
      }
      
      setIsFormOpen(false);
      setEditingTask(null);
      if (attachmentError) alert(`Task saved, but attachments failed: ${attachmentError}`);
    } catch (err) {
      alert("Unable to save task. Please try again.");
    }
  };

  // Toggle a task status inline
  const handleToggleStatus = async (id, status, newValue) => {
    try {
      // Optimistic UI Update
      setTasks(current => current.map(t => {
        if (t._id === id) {
          return {
            ...t,
            [status]: newValue,
            ...(status === 'done' ? { completedAt: newValue ? new Date().toISOString() : null } : {}),
          };
        }
        return t;
      }));

      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [status]: newValue }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      const updatedTask = await res.json();
      // Ensure strict sync
      setTasks(current => current.map(t => t._id === id ? updatedTask : t));
    } catch (err) {
      alert("Failed to update status.");
      fetchTasks(); // Revert on failure
    }
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    try {
      const res = await fetch(`/api/tasks/${deletingTask._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setTasks(tasks.filter(t => t._id !== deletingTask._id));
      setDeletingTask(null);
    } catch (err) {
      alert("Unable to delete task.");
      setDeletingTask(null);
    }
  };

  // Filter, Search, Sort Logic
  const processedTasks = useMemo(() => {
    let result = [...tasks];

    // 1. Filter View
    if (filter === 'OPEN') result = result.filter(t => !t.done);
    if (filter === 'DONE') result = result.filter(t => t.done);
    if (filter === 'IAN') result = result.filter(t => !t.done && t.ian);
    if (filter === 'VENDOR') result = result.filter(t => !t.done && t.vendor);
    
    // 2. Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        (t.name || '').toLowerCase().includes(q) ||
        (t.task || '').toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q) ||
        (t.address || '').toLowerCase().includes(q) ||
        (t.phone || '').toLowerCase().includes(q) ||
        (t.email || '').toLowerCase().includes(q)
      );
    }

    // 3. Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'address-asc') return (a.address || '').localeCompare(b.address || '');
      if (sortBy === 'address-desc') return (b.address || '').localeCompare(a.address || '');
      if (sortBy === 'name-asc') return (a.name || 'zzz').localeCompare(b.name || 'zzz');
      if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
      return 0;
    });

    return result;
  }, [tasks, filter, searchQuery, sortBy]);


  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-brand-red pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <Image src="/nvh-logo.png" alt="New Victorian Homes" width={2000} height={414} priority className="h-12 w-auto" />
          <div className="sm:border-l-2 sm:border-gray-300 sm:pl-6">
            <h1 className="text-2xl font-black text-brand-charcoal tracking-tight">WORK FOLLOW-UP TRACKER</h1>
            <p className="text-gray-500 text-sm">New Victorian Homes task management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="flex items-center justify-center gap-2 border-2 border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal hover:text-white px-5 py-2.5 rounded-lg font-bold transition-colors"
          >
            <BarChart3 size={20} /> REPORTS
          </Link>
          <button 
            onClick={() => { setEditingTask(null); setIsFormOpen(true); }}
            className="flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3 rounded-lg font-bold shadow-sm transition-colors"
          >
            <Plus size={20} /> ADD TASK
          </button>
        </div>
      </header>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">{error}</div>}

      <DashboardStats tasks={tasks} currentFilter={filter} onFilterChange={setFilter} />

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded focus:bg-white focus:ring-2 focus:ring-brand-red outline-none"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-sm font-medium text-gray-500">SORT:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded py-2 px-3 text-sm focus:ring-2 focus:ring-brand-red outline-none w-full md:w-auto"
          >
            <option value="address-asc">Address (A-Z)</option>
            <option value="address-desc">Address (Z-A)</option>
            <option value="newest">Entered Date (Newest First)</option>
            <option value="oldest">Entered Date (Oldest First)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </div>
      </div>

      <div className="mb-4 text-xl font-bold text-gray-800 uppercase tracking-wide border-b pb-2">
        {filter} TASKS ({processedTasks.length})
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Loading tasks...</div>
      ) : (
        <div className="overflow-x-auto">
          {processedTasks.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-lg border border-gray-200 text-gray-500 text-lg">
              No tasks found for the current view.
            </div>
          ) : (
            <div className="min-w-[1017px]">
              <div className="task-row-grid w-full border border-transparent px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                <button
                  type="button"
                  onClick={() => toggleSort('address')}
                  className="flex items-center gap-1 text-left hover:text-gray-900"
                  aria-label={`Sort by address ${sortBy === 'address-asc' ? 'descending' : 'ascending'}`}
                >
                  Address
                  {sortBy === 'address-asc' ? <ArrowUp size={14} /> : sortBy === 'address-desc' ? <ArrowDown size={14} /> : null}
                </button>
                <span>Task</span>
                <button
                  type="button"
                  onClick={() => toggleSort('date')}
                  className="flex items-center gap-1 text-left hover:text-gray-900"
                  aria-label={`Sort by entered date ${sortBy === 'oldest' ? 'newest first' : 'oldest first'}`}
                >
                  Entered
                  {sortBy === 'oldest' ? <ArrowUp size={14} /> : sortBy === 'newest' ? <ArrowDown size={14} /> : null}
                </button>
                <span>Status</span>
                <span className="sr-only">Actions</span>
              </div>
              <div className="flex flex-col gap-2">
                {processedTasks.map(task => (
                  <TaskCard 
                    key={task._id} 
                    task={task} 
                    onEdit={(t) => { setEditingTask(t); setIsFormOpen(true); }}
                    onDelete={(t) => setDeletingTask(t)}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isFormOpen && (
        <TaskForm 
          task={editingTask} 
          existingTasks={tasks}
          onSave={handleSaveTask} 
          onCancel={() => { setIsFormOpen(false); setEditingTask(null); }} 
        />
      )}

      <ConfirmDialog 
        isOpen={!!deletingTask}
        message="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={handleDeleteTask}
        onCancel={() => setDeletingTask(null)}
      />
    </div>
  );
}