"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import {
  downloadCsv,
  filterTasks,
  formatDate,
  groupByAddress,
  summarize,
  tasksToCsv,
} from '@/lib/reportUtils';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All tasks' },
  { value: 'OPEN', label: 'Open' },
  { value: 'DONE', label: 'Done' },
  { value: 'IAN', label: 'Ian' },
  { value: 'VENDOR', label: 'Vendor' },
];

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">{label}</div>
      <div className="text-2xl font-black text-brand-charcoal">{value}</div>
    </div>
  );
}

export default function ReportsPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [status, setStatus] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/tasks')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load tasks');
        return res.json();
      })
      .then(data => { if (!cancelled) setTasks(data); })
      .catch(() => { if (!cancelled) setError('Unable to load tasks. Please check your connection.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return filterTasks(tasks, { status, from, to })
      .sort((a, b) => (a.address || '').localeCompare(b.address || '') || new Date(a.createdAt) - new Date(b.createdAt));
  }, [tasks, status, from, to]);

  const summary = useMemo(() => summarize(filtered), [filtered]);
  const byAddress = useMemo(() => groupByAddress(filtered), [filtered]);

  const statusLabel = STATUS_OPTIONS.find(o => o.value === status).label;
  const rangeLabel = from || to ? `${from || 'start'} to ${to || 'today'}` : 'All dates';
  const today = formatDate(new Date());

  const handleExport = () => {
    downloadCsv(`nvh-tasks-${today}.csv`, tasksToCsv(filtered));
  };

  const hasFilters = status !== 'ALL' || from || to;

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <header className="mb-6 flex flex-col justify-between gap-4 border-b-4 border-brand-red pb-5 md:flex-row md:items-center">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Image src="/nvh-logo.png" alt="New Victorian Homes" width={2000} height={414} priority className="h-12 w-auto" />
          <div className="sm:border-l-2 sm:border-gray-300 sm:pl-6">
            <h1 className="text-2xl font-black tracking-tight text-brand-charcoal">TASK REPORT</h1>
            <p className="text-sm text-gray-500">Generated {today}</p>
          </div>
        </div>
        <Link
          href="/"
          className="no-print flex items-center justify-center gap-2 rounded-lg border-2 border-brand-charcoal px-5 py-2.5 font-bold text-brand-charcoal transition-colors hover:bg-brand-charcoal hover:text-white"
        >
          <ArrowLeft size={20} /> BACK TO TASKS
        </Link>
      </header>

      <div className="no-print mb-6 flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:items-end">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded border border-gray-300 bg-gray-50 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-red"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Entered from
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded border border-gray-300 bg-gray-50 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-red"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Entered to
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className="rounded border border-gray-300 bg-gray-50 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-red"
          />
        </label>
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setStatus('ALL'); setFrom(''); setTo(''); }}
            className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            Clear filters
          </button>
        )}
        <div className="flex gap-3 lg:ml-auto">
          <button
            type="button"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-lg border-2 border-brand-charcoal px-4 py-2 font-bold text-brand-charcoal transition-colors hover:bg-brand-charcoal hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-brand-charcoal"
          >
            <Download size={18} /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2 font-bold text-white transition-colors hover:bg-brand-red-dark"
          >
            <Printer size={18} /> Print
          </button>
        </div>
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      {loading ? (
        <div className="py-12 text-center font-medium text-gray-500">Loading report...</div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-600">
            <strong>Showing:</strong> {statusLabel} · {rangeLabel} · {filtered.length} task{filtered.length === 1 ? '' : 's'}
          </p>

          <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Total" value={summary.total} />
            <Stat label="Open" value={summary.open} />
            <Stat label="Done" value={summary.done} />
            <Stat label="Ian" value={summary.ian} />
            <Stat label="Vendor" value={summary.vendor} />
            <Stat
              label="Avg days to done"
              value={summary.avgDaysToComplete === null ? '–' : summary.avgDaysToComplete.toFixed(1)}
            />
          </section>
          {summary.oldestOpenDays !== null && (
            <p className="mb-8 text-sm text-gray-600">
              Oldest open task has been waiting <strong>{summary.oldestOpenDays}</strong> day{summary.oldestOpenDays === 1 ? '' : 's'}.
            </p>
          )}

          <section className="mb-8">
            <h2 className="mb-2 border-b pb-2 text-lg font-bold uppercase tracking-wide text-gray-800">By address</h2>
            {byAddress.length === 0 ? (
              <p className="py-4 text-gray-500">No tasks match these filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="py-2 pr-4">Address</th>
                      <th className="px-2 py-2 text-right">Total</th>
                      <th className="px-2 py-2 text-right">Open</th>
                      <th className="px-2 py-2 text-right">Done</th>
                      <th className="px-2 py-2 text-right">Ian</th>
                      <th className="py-2 pl-2 text-right">Vendor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {byAddress.map(g => (
                      <tr key={g.address}>
                        <td className="py-2 pr-4 font-medium text-gray-900">{g.address}</td>
                        <td className="px-2 py-2 text-right">{g.total}</td>
                        <td className="px-2 py-2 text-right">{g.open}</td>
                        <td className="px-2 py-2 text-right">{g.done}</td>
                        <td className="px-2 py-2 text-right">{g.ian}</td>
                        <td className="py-2 pl-2 text-right">{g.vendor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {filtered.length > 0 && (
            <section>
              <h2 className="mb-2 border-b pb-2 text-lg font-bold uppercase tracking-wide text-gray-800">Task detail</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="py-2 pr-4">Address</th>
                      <th className="px-2 py-2">Task</th>
                      <th className="px-2 py-2">Contact</th>
                      <th className="px-2 py-2">Entered</th>
                      <th className="px-2 py-2">Completed</th>
                      <th className="py-2 pl-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(t => (
                      <tr key={t._id} className="align-top">
                        <td className="py-2 pr-4 text-gray-900">{t.address || '(No address)'}</td>
                        <td className="px-2 py-2 font-medium text-gray-900">{t.task}</td>
                        <td className="px-2 py-2 text-gray-600">
                          {[t.name, t.phone, t.email].filter(Boolean).join(' · ')}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-gray-600">{formatDate(t.createdAt)}</td>
                        <td className="whitespace-nowrap px-2 py-2 text-gray-600">{formatDate(t.completedAt)}</td>
                        <td className="py-2 pl-2 font-bold text-gray-700">
                          {[t.ian && 'IAN', t.vendor && 'VENDOR', t.done && 'DONE'].filter(Boolean).join(', ') || 'Open'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
