'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetcher } from '@/lib/utils';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [settings, setSettings] = useState({
    votingOpen: false,
    votingStartDate: '',
    votingEndDate: '',
    resultsPublic: false,
    maintenanceMode: false,
    maxVotesPerIp: '',
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadSettings();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    try {
      const result = await fetcher('/api/auth/me');
      if (result.success && result.user?.isAdmin) {
        setIsAdmin(true);
      } else {
        router.push('/vote');
      }
    } catch {
      router.push('/vote');
    }
  };

  const loadSettings = async () => {
    try {
      const result = await fetcher('/api/admin/settings');
      const data = result.data;
      
      setSettings({
        votingOpen: data.votingOpen || false,
        votingStartDate: data.votingStartDate ? new Date(data.votingStartDate).toISOString().slice(0, 16) : '',
        votingEndDate: data.votingEndDate ? new Date(data.votingEndDate).toISOString().slice(0, 16) : '',
        resultsPublic: data.resultsPublic || false,
        maintenanceMode: data.maintenanceMode || false,
        maxVotesPerIp: data.maxVotesPerIp?.toString() || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await fetcher('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          votingOpen: settings.votingOpen,
          votingStartDate: settings.votingStartDate || null,
          votingEndDate: settings.votingEndDate || null,
          resultsPublic: settings.resultsPublic,
          maintenanceMode: settings.maintenanceMode,
          maxVotesPerIp: settings.maxVotesPerIp ? parseInt(settings.maxVotesPerIp) : null,
        }),
      });

      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVoting = async () => {
    const newValue = !settings.votingOpen;
    setSettings({ ...settings, votingOpen: newValue });
    
    try {
      await fetcher('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          ...settings,
          votingOpen: newValue,
        }),
      });
      setMessage(`Voting ${newValue ? 'opened' : 'closed'} successfully!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update voting status');
      setSettings({ ...settings, votingOpen: !newValue }); // Revert on error
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Voting Settings</h1>
              <p className="text-gray-600 text-sm mt-1">Configure voting periods and access controls</p>
            </div>
            <Link href="/admin/dashboard" className="btn btn-secondary">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Quick Toggle */}
          <div className="card bg-gradient-to-r from-purple-600 to-purple-800 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Voting Status</h2>
                <p className="text-purple-100 mt-1">
                  {settings.votingOpen ? 'Voting is currently open' : 'Voting is currently closed'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleVoting}
                className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors ${
                  settings.votingOpen ? 'bg-green-500' : 'bg-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-10 w-10 transform rounded-full bg-white transition-transform ${
                    settings.votingOpen ? 'translate-x-12' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Voting Period */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Voting Period</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={settings.votingStartDate}
                  onChange={(e) => setSettings({ ...settings, votingStartDate: e.target.value })}
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for immediate start
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={settings.votingEndDate}
                  onChange={(e) => setSettings({ ...settings, votingEndDate: e.target.value })}
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for no end date
                </p>
              </div>
            </div>
          </div>

          {/* Results Settings */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Results Settings</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">Public Results</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Allow anyone to view voting results
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.resultsPublic}
                  onChange={(e) => setSettings({ ...settings, resultsPublic: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>

          {/* Fraud Prevention */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Fraud Prevention</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Votes Per IP Address
              </label>
              <input
                type="number"
                value={settings.maxVotesPerIp}
                onChange={(e) => setSettings({ ...settings, maxVotesPerIp: e.target.value })}
                className="input"
                min="1"
                placeholder="Leave empty for no limit"
              />
              <p className="text-xs text-gray-500 mt-1">
                Limit the number of votes from the same IP address
              </p>
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Maintenance</h2>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <h3 className="font-semibold text-gray-900">Maintenance Mode</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Show maintenance page to all users (admins can still access)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary flex-1 text-lg py-3"
            >
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
            <button
              type="button"
              onClick={loadSettings}
              className="btn btn-secondary px-8"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Current Status Summary */}
        <div className="card mt-8 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">Current Status Summary</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>
              • Voting: <strong>{settings.votingOpen ? 'Open' : 'Closed'}</strong>
            </li>
            <li>
              • Results: <strong>{settings.resultsPublic ? 'Public' : 'Private'}</strong>
            </li>
            <li>
              • Maintenance: <strong>{settings.maintenanceMode ? 'On' : 'Off'}</strong>
            </li>
            {settings.votingStartDate && (
              <li>
                • Start: <strong>{new Date(settings.votingStartDate).toLocaleString()}</strong>
              </li>
            )}
            {settings.votingEndDate && (
              <li>
                • End: <strong>{new Date(settings.votingEndDate).toLocaleString()}</strong>
              </li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
