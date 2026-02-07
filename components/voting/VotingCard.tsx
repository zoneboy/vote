// ============================================================================
// SECURITY FIX: VotingCard Component with CSRF Protection
// ============================================================================
// Added custom header to prevent CSRF attacks
// ============================================================================

'use client';

import { useState } from 'react';
import type { CategoryWithNominees } from '@/types';

interface VotingCardProps {
  category: CategoryWithNominees;
  onVote: (categoryId: string, nomineeId: string) => void;
  selectedNominee?: string;
  disabled?: boolean;
}

export function VotingCard({ category, onVote, selectedNominee, disabled }: VotingCardProps) {
  const [selected, setSelected] = useState<string>(selectedNominee || '');

  const handleSelect = (nomineeId: string) => {
    if (disabled) return;
    setSelected(nomineeId);
    onVote(category.id, nomineeId);
  };

  return (
    <div className="card hover:shadow-xl transition-all">
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-gray-900">{category.name}</h3>
        {category.description && (
          <p className="text-gray-600 text-sm mt-1">{category.description}</p>
        )}
      </div>

      <div className="space-y-3">
        {category.nominees.map((nominee) => {
          const isSelected = selected === nominee.id;
          const isAlreadyVoted = selectedNominee === nominee.id;

          return (
            <button
              key={nominee.id}
              onClick={() => handleSelect(nominee.id)}
              disabled={disabled}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : isAlreadyVoted
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{nominee.name}</div>
                  {nominee.description && (
                    <div className="text-sm text-gray-600 mt-1">{nominee.description}</div>
                  )}
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected || isAlreadyVoted
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300'
                  }`}
                >
                  {(isSelected || isAlreadyVoted) && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedNominee && (
        <div className="mt-3 text-sm text-green-600 font-medium">
          ✓ You already voted in this category
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SECURITY: Helper function to make vote API calls with CSRF protection
// ============================================================================

export async function submitVotes(votes: Array<{ categoryId: string; nomineeId: string }>) {
  const response = await fetch('/api/vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Voting-Request': 'true', // SECURITY: Custom header for CSRF-like protection
    },
    body: JSON.stringify({ votes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit votes');
  }

  return response.json();
}
