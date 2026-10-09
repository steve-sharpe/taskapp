'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        router.replace('/');
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Login failed');
      setPin('');
    } catch {
      setError('Unable to reach the server.');
    }
    setBusy(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-xs bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center"
      >
        <Image src="/nvh-logo.png" alt="New Victorian Homes" width={200} height={56} className="mx-auto mb-4 h-auto" priority />
        <h1 className="text-lg font-bold text-brand-charcoal mb-4">Enter PIN</h1>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          autoFocus
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className="w-full text-center text-2xl tracking-[0.5em] border border-gray-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-brand-red"
          aria-label="4-digit PIN"
        />
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        <button
          type="submit"
          disabled={busy || pin.length !== 4}
          className="w-full mt-4 bg-brand-red hover:bg-brand-red-dark disabled:opacity-50 text-white font-bold py-2 rounded-lg"
        >
          UNLOCK
        </button>
      </form>
    </main>
  );
}
