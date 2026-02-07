'use client';

import type { CategoryWithNominees } from '@/types';

interface VotingCardProps {
  category: CategoryWithNominees;
  onVote: (categoryId: string, nomineeId: string) => void;
  selectedNominee?: string;
  disabled?: boolean;
}

export function VotingCard({ category, onVote, selectedNominee, disabled }: VotingCardProps) {
  const handleNomineeClick = (nomineeId: string) => {
    if (disabled) return;
    onVote(category.id, nomineeId);
  };

  return (
    <div className="card hover:shadow-xl transition-shadow">
      {/* Category Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
        {category.description && (
          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          {category.nominees.length} {category.nominees.length === 1 ? 'nominee' : 'nominees'}
        </p>
      </div>

      {/* All Nominees - No hiding, full transparency */}
      <div className="space-y-2">
        {category.nominees.map((nominee) => {
          const isSelected = selectedNominee === nominee.id;
          const isUserVote = category.userVote === nominee.id;

          return (
            <button
              key={nominee.id}
              onClick={() => handleNomineeClick(nominee.id)}
              disabled={disabled || isUserVote}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : isUserVote
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
              } ${disabled && !isUserVote ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    {nominee.name}
                    {isUserVote && (
                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                        Your Vote
                      </span>
                    )}
                    {isSelected && !isUserVote && (
                      <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  {nominee.description && (
                    <p className="text-sm text-gray-600 mt-1">{nominee.description}</p>
                  )}
                </div>
                <div className="ml-3 flex-shrink-0">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected || isUserVote
                        ? isUserVote
                          ? 'border-green-500 bg-green-500'
                          : 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {(isSelected || isUserVote) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* No "Show More" button - all nominees visible for transparency */}
    </div>
  );
}
