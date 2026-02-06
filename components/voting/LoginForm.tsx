'use client';

import { useState } from 'react';
import { fetcher } from '@/lib/utils';

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const result = await fetcher('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, method: 'otp' }),
      });

      setMessage(result.message);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await fetcher('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });

      if (result.success) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
          <p className="text-purple-100">Enter your email to vote</p>
        </div>

        <div className="p-8">
          {step === 'email' ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full text-lg py-3"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                We'll send you a 6-digit code to verify your email
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="input text-center text-2xl tracking-widest font-mono"
                  required
                  maxLength={6}
                  disabled={loading}
                  autoFocus
                />
                <p className="text-sm text-gray-600 mt-2">
                  Code sent to <strong>{email}</strong>
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn btn-primary w-full text-lg py-3"
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="btn btn-secondary w-full"
                disabled={loading}
              >
                Use Different Email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
