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
  const [selected, setSelected] = useState<string | undefined>(selectedNominee);

  const handleSelect = (nomineeId: string) => {
    if (disabled) return;
    setSelected(nomineeId);
    onVote(category.id, nomineeId);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{category.name}</h2>
        {category.description && (
          <p className="text-purple-100 text-sm">{category.description}</p>
        )}
      </div>

      {/* Nominees */}
      <div className="p-6 space-y-3">
        {category.nominees.map((nominee) => {
          const isSelected = selected === nominee.id;
          const hasVoted = category.userVote === nominee.id;

          return (
            <button
              key={nominee.id}
              onClick={() => handleSelect(nominee.id)}
              disabled={disabled}
              className={`
                w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
                ${
                  isSelected || hasVoted
                    ? 'border-purple-500 bg-purple-50 shadow-md scale-[1.02]'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }
                ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{nominee.name}</div>
                  {nominee.description && (
                    <div className="text-sm text-gray-600 mt-1">{nominee.description}</div>
                  )}
                </div>

                {/* Radio indicator */}
                <div
                  className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center ml-4
                    ${
                      isSelected || hasVoted
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }
                  `}
                >
                  {(isSelected || hasVoted) && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer - shows vote status */}
      {category.userVote && (
        <div className="px-6 pb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            ✓ You voted in this category
          </div>
        </div>
      )}
    </div>
  );
}
