export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Nominee {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  createdAt: Date;
  voteCount?: number;
}

export interface Vote {
  id: string;
  userId: string;
  categoryId: string;
  nomineeId: string;
  ipAddress?: string;
  userAgent?: string;
  votedAt: Date;
}

export interface VotingSession {
  userId: string;
  email: string;
  votedCategories: string[];
  completedAt?: Date;
}

export interface Settings {
  votingOpen: boolean;
  votingStartDate?: Date;
  votingEndDate?: Date;
  resultsPublic: boolean;
  maintenanceMode: boolean;
  maxVotesPerIp?: number;
}

export interface AdminStats {
  totalVotes: number;
  totalUsers: number;
  totalCategories: number;
  totalNominees: number;
  votingStatus: 'open' | 'closed' | 'upcoming';
  recentVotes: Vote[];
  topCategories: { categoryId: string; name: string; voteCount: number }[];
}

export interface VoteSubmission {
  categoryId: string;
  nomineeId: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CategoryWithNominees extends Category {
  nominees: Nominee[];
  userVote?: string; // nominee ID if user voted
}

export interface VoteResult {
  categoryId: string;
  categoryName: string;
  nominees: {
    nomineeId: string;
    nomineeName: string;
    voteCount: number;
    percentage: number;
  }[];
  totalVotes: number;
}
