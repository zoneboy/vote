'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VotingCard } from '@/components/voting/VotingCard';
import { LoginForm } from '@/components/voting/LoginForm';
import { fetcher } from '@/lib/utils';
import type { CategoryWithNominees } from '@/types';

export default function VotePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState<CategoryWithNominees[]>([]);
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      loadCategories();
    } else if (isAuthenticated && isAdmin) {
      // Redirect admin to dashboard
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, isAdmin, router]);

  const checkAuth = async () => {
    try {
      const result = await fetcher('/api/auth/verify');
      setIsAuthenticated(result.success);
      
      // Check if user is admin by fetching user info
      if (result.success) {
        const userResult = await fetcher('/api/auth/me');
        setIsAdmin(userResult.user?.isAdmin || false);
      }
    } catch {
      setIsAuthenticated(false);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const result = await fetcher('/api/categories');
      setCategories(result.data);

      // Pre-fill existing votes
      const votes: Record<string, string> = {};
      result.data.forEach((cat: CategoryWithNominees) => {
        if (cat.userVote) {
          votes[cat.id] = cat.userVote;
        }
      });
      setSelectedVotes(votes);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    }
  };

  const handleVote = (categoryId: string, nomineeId: string) => {
    setSelectedVotes((prev) => ({
      ...prev,
      [categoryId]: nomineeId,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedVotes).length === 0) {
      setError('Please select at least one nominee');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const votes = Object.entries(selectedVotes).map(([categoryId, nomineeId]) => ({
        categoryId,
        nomineeId,
      }));

      await fetcher('/api/vote', {
        method: 'POST',
        body: JSON.stringify({ votes }),
      });

      router.push('/confirmation');
    } catch (err: any) {
      setError(err.message || 'Failed to submit votes');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pattern">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pattern p-4">
        <LoginForm />
      </div>
    );
  }

  // If admin, component will redirect in useEffect
  if (isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pattern">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient">Awards 2025</h1>
              <p className="text-gray-600 text-sm mt-1">Cast your votes for the best of the year</p>
            </div>
            <div className="text-sm text-gray-600">
              {Object.keys(selectedVotes).length} of {categories.length} voted
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 mb-8">
          {categories.map((category) => (
            <VotingCard
              key={category.id}
              category={category}
              onVote={handleVote}
              selectedNominee={selectedVotes[category.id]}
              disabled={submitting}
            />
          ))}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {Object.keys(selectedVotes).length === 0 ? (
                'Select nominees to submit your votes'
              ) : (
                <>
                  <strong>{Object.keys(selectedVotes).length}</strong> {Object.keys(selectedVotes).length === 1 ? 'vote' : 'votes'} ready to submit
                </>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(selectedVotes).length === 0}
              className="btn btn-primary px-8 py-3 text-lg"
            >
              {submitting ? (
                <>
                  <div className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit Votes'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
