// Simplified OKR types - cleaner structure
export interface OKR {
  id: number;
  team_id: number;
  year: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  okr_level: 'strategic' | 'operational' | 'tactical';
  objective: string;
  description?: string | null;
  status: 'draft' | 'active' | 'completed';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OKRDetail extends OKR {
  key_results: KeyResult[];
}

export interface KeyResult {
  id: number;
  okr_id: number;
  description: string;
  base_value: string;
  target_value: string;
  current_value: string;
  unit: string;
  weight: string;
  created_at: string;
  updated_at: string;
}

export interface KeyResultWithScore extends KeyResult {
  score: number; // 0.0 to 1.0
}

export interface OKRCreate {
  okr_level: 'strategic' | 'operational' | 'tactical';
  year: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  objective: string;
  description?: string;
  status?: 'draft' | 'active' | 'completed';
  key_results?: KeyResultCreate[];
}

export interface KeyResultCreate {
  description: string;
  base_value: number | string;
  target_value: number | string;
  unit: string;
  weight: number | string;
}

export interface OKRWithScores extends OKR {
  key_results: KeyResultWithScore[];
  objective_score: number; // 0.0 to 1.0
  status: 'Green' | 'Yellow' | 'Red';
}

