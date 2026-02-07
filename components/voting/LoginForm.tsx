'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetcher } from '@/lib/utils';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
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
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          method: 'otp' 
        }),
      });

      setMessage(result.message);
      setStep('otp');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Verifying OTP:', { email: email.toLowerCase().trim(), otp: otp.trim() });
      
      const result = await fetcher('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          otp: otp.trim() 
        }),
      });

      console.log('Verification result:', result);

      if (result.success) {
        // Check if user is admin and redirect accordingly
        if (result.user?.isAdmin) {
          router.push('/admin/dashboard');
        } else if (onSuccess) {
          onSuccess();
        } else {
          router.push('/vote');
        }
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      
      // Show more specific error messages
      let errorMessage = 'Invalid code. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      // Add helpful hints based on error
      if (err.message?.includes('expired')) {
        errorMessage += ' The code has expired. Please request a new one.';
      } else if (err.message?.includes('Invalid')) {
        errorMessage += ' Make sure you entered the 6-digit code correctly.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setOtp('');
    setError('');
    setMessage('');
    await handleRequestCode(new Event('submit') as any);
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
                  autoFocus
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
                {loading ? (
                  <>
                    <div className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending...
                  </>
                ) : (
                  'Send Verification Code'
                )}
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
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn btn-primary w-full text-lg py-3"
              >
                {loading ? (
                  <>
                    <div className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="btn btn-secondary flex-1"
                  disabled={loading}
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setError('');
                    setMessage('');
                  }}
                  className="btn btn-secondary flex-1"
                  disabled={loading}
                >
                  Change Email
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                Code expires in 15 minutes
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
