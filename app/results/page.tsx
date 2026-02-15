'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetcher } from '@/lib/utils';
import type { VoteResult } from '@/types';

export default function ResultsPage() {
  const [results, setResults] = useState<VoteResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resultsPublic, setResultsPublic] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const response = await fetcher('/api/results');
      
      if (response.success) {
        setResults(response.data);
        setResultsPublic(true);
        setIsAdmin(response.isAdmin || false);
      } else {
        setResultsPublic(false);
        setError(response.error || 'Results are not public yet');
      }
    } catch (err: any) {
      setResultsPublic(false);
      setError(err.message || 'Results are not available yet');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pattern">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!resultsPublic) {
    return (
      <div className="min-h-screen bg-pattern flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Results Not Available</h1>
              <p className="text-purple-100">{error || 'Results will be published after voting closes'}</p>
            </div>
            
            <div className="p-8 text-center">
              <Link href="/vote" className="btn btn-primary px-8 py-3">
                Go to Voting
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient">Voting Results</h1>
              <p className="text-gray-600 text-sm mt-1">See how everyone voted</p>
              {isAdmin && (
                <p className="text-xs text-purple-600 mt-1 font-medium">
                  🔒 Admin Preview Mode
                </p>
              )}
            </div>
            <Link href="/vote" className="btn btn-primary">
              Cast Your Vote
            </Link>
          </div>
        </div>
      </header>

      {/* Admin Notice */}
      {isAdmin && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-purple-900">Admin Access</p>
                <p className="text-sm text-purple-800 mt-1">
                  You're viewing these results as an admin. Regular users cannot see results until they are made public in the voting settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {results.map((result) => (
            <div key={result.categoryId} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Category Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white">
                <h2 className="text-2xl font-bold mb-1">{result.categoryName}</h2>
                <p className="text-purple-100 text-sm">
                  {result.totalVotes} {result.totalVotes === 1 ? 'vote' : 'votes'}
                </p>
              </div>

              {/* Nominees Results */}
              <div className="p-6 space-y-4">
                {result.nominees.map((nominee, index) => {
                  const isWinner = index === 0;
                  return (
                    <div
                      key={nominee.nomineeId}
                      className={`p-4 rounded-xl border-2 ${
                        isWinner
                          ? 'border-yellow-400 bg-yellow-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {isWinner && (
                            <div className="text-2xl">🏆</div>
                          )}
                          <div>
                            <div className={`font-semibold ${isWinner ? 'text-yellow-900' : 'text-gray-900'}`}>
                              {nominee.nomineeName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {nominee.voteCount} {nominee.voteCount === 1 ? 'vote' : 'votes'}
                            </div>
                          </div>
                        </div>
                        <div className={`text-2xl font-bold ${isWinner ? 'text-yellow-600' : 'text-gray-700'}`}>
                          {nominee.percentage}%
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            isWinner
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                              : 'bg-gradient-to-r from-purple-400 to-purple-600'
                          }`}
                          style={{ width: `${nominee.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-600">No results available yet. Check back after voting closes!</p>
          </div>
        )}
      </main>
    </div>
  );
}