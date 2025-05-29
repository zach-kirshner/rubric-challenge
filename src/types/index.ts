export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RubricItem {
  id: string;
  criterion: string;
  isPositive?: boolean;
  order?: number;
}

export interface Action {
  type: 'add' | 'edit' | 'delete' | 'reorder';
  itemId?: string;
  originalText?: string;
  newText?: string;
  justification: string;
  timestamp: string;
  previousOrder?: number;
  newOrder?: number;
}

// Database models
export interface Criterion {
  id: string;
  submissionId: string;
  originalId: string;
  text: string;
  isPositive: boolean;
  source: 'ai_generated' | 'user_added';
  status: 'active' | 'edited' | 'deleted';
  finalText?: string;
  order: number;
  createdAt: Date;
}

export interface CriterionAction {
  id: string;
  submissionId: string;
  criterionId?: string;
  actionType: 'add' | 'edit' | 'delete' | 'reorder';
  previousText?: string;
  newText?: string;
  previousOrder?: number;
  newOrder?: number;
  justification: string;
  timestamp: Date;
  createdAt: Date;
}

export interface Submission {
  id: string;
  userId: string;
  prompt: string;
  status: 'in_progress' | 'submitted';
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  criteria?: Criterion[];
  criteriaActions?: CriterionAction[];
} 