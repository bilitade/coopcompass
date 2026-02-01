// Import WeeklyPriority types for use in Dashboard interface
import type {
  WeeklyPriority,
  WeeklyPriorityCreate,
  WeeklyPriorityWithProgress,
} from '../../features/priorities/types';

// User types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'member' | 'lead' | 'director' | 'executive' | 'admin';
  team_id: number | null;
  team_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  name: string;
  email: string;
  role: 'member' | 'lead' | 'director' | 'executive' | 'admin';
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Department types
export interface Department {
  id: number;
  name: string;
  description?: string | null;
  director_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DepartmentDetail extends Department {
  teams: Team[];
  director?: User | null;
}

// Team types
export interface Team {
  id: number;
  name: string;
  department_id?: number | null;
  department?: Department | null;
  users?: User[];
  created_at: string;
  updated_at: string;
}

export interface TeamDetail extends Team {
  users: User[];
}

// OKR types
export interface OKR {
  id: number;
  team_id: number;
  quarter: string;
  objective: string;
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
  target_value: string;
  current_value: string;
  unit: string | null;
  created_at: string;
  updated_at: string;
}

export interface OKRCreate {
  quarter: string;
  objective: string;
}

export interface KeyResultCreate {
  description: string;
  target_value: number | string;
  unit?: string | null;
}

export interface KRProgress {
  kr_id: number;
  description: string;
  progress: number;
  current_value: string;
  target_value: string;
}

export interface OKRProgress {
  okr_id: number;
  objective: string;
  quarter: string;
  progress: number;
  key_results: KRProgress[];
}

// BAU types
export interface BAUActivity {
  id: number;
  team_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BAUActivityDetail extends BAUActivity {
  metrics: BAUMetric[];
}

export interface BAUMetric {
  id: number;
  bau_activity_id: number;
  name: string;
  target_value: string;
  current_value: string;
  unit: string | null;
  weight: string;
  is_higher_better: boolean;
  created_at: string;
  updated_at: string;
}

export interface BAUActivityCreate {
  name: string;
  description?: string | null;
}

export interface BAUMetricCreate {
  name: string;
  target_value: number | string;
  unit?: string | null;
  weight?: number | string;
  is_higher_better?: boolean;
}

export interface BAUHealth {
  activity_id: number;
  activity_name: string;
  health: number;
  metrics: BAUMetric[];
}

// Work Item types
export interface WorkItem {
  id: number;
  team_id: number;
  name: string;
  description: string | null;
  source_type: 'OKR' | 'BAU';
  source_id: number;
  owner_id: number | null;
  month: string;
  created_at: string;
  updated_at: string;
}

export interface WorkItemDetail extends WorkItem {
  owner: User | null;
  tasks: Task[];
}

export interface WorkItemCreate {
  name: string;
  description?: string | null;
  source_type: 'OKR' | 'BAU';
  source_id: number;
  owner_id?: number | null;
  month: string;
}

// Task types
export interface Task {
  id: number;
  work_item_id: number;
  description: string;
  assignee_id: number | null;
  status: 'Not Started' | 'In Progress' | 'Done' | 'Blocked';
  effort_hours: number | null;
  blocked_reason: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface TaskDetail extends Task {
  assignee: User | null;
}

export interface TaskCreate {
  description: string;
  assignee_id?: number | null;
  effort_hours?: number | null;
}

export interface TaskUpdate {
  description?: string | null;
  assignee_id?: number | null;
  status?: 'Not Started' | 'In Progress' | 'Done' | 'Blocked';
  effort_hours?: number | null;
  blocked_reason?: string | null;
}

// Weekly Priority types - re-exported from priorities feature module
export type { WeeklyPriority, WeeklyPriorityCreate, WeeklyPriorityWithProgress };

// Dashboard types
export interface Dashboard {
  team_id: number;
  okr_progress: number;
  bau_health: number;
  okrs: OKRProgress[];
  bau_activities: BAUHealth[];
  current_week_priorities: WeeklyPriorityWithProgress[];
  updated_at: string;
}

export interface PerformanceTrend {
  date: string;
  okr_progress: number;
  bau_health: number;
}

