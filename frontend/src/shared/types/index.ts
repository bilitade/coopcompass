// Import WeeklyPriority types for use in Dashboard interface
import type {
  WeeklyPriority,
  WeeklyPriorityCreate,
  WeeklyPriorityWithProgress,
  WeeklyPriorityPlan,
  WeeklyPriorityPlanCreate,
} from '../../features/weeklyPriority/types';

import type {
  Task,
  TaskDetail,
  TaskCreate,
  TaskUpdate,
} from '../../features/tasks/types';

export type { Task, TaskDetail, TaskCreate, TaskUpdate };

// User types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'member' | 'lead' | 'director' | 'executive' | 'admin';
  team_id: number | null;
  team_name?: string;
  department_name?: string;
  position?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  name: string;
  email: string;
  role: 'member' | 'lead' | 'director' | 'executive' | 'admin';
  position?: string;
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
  description?: string | null;
  department_id?: number | null;
  department?: Department | null;
  users?: User[];
  created_at: string;
  updated_at: string;
}

export interface TeamDetail extends Team {
  users: User[];
}

// OKR types - Simplified and clean
export interface OKR {
  id: number;
  team_id: number;
  year: number;
  quarters: string; // Single quarter like "Q1"
  okr_level: 'strategic' | 'operational' | 'tactical';
  objective: string;
  description?: string | null;
  status: 'draft' | 'active' | 'completed';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  quarter?: string; // Legacy field
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
  objective_score?: number; // 0.0 to 1.0 (Optional to match safe access)
  health_status?: 'Green' | 'Yellow' | 'Red';
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
  metrics: BAUMetricWithAchievement[];
}

export interface BAUMetric {
  id: number;
  bau_activity_id: number;
  name: string;
  target_value: string;
  current_value: string;
  unit: string;
  weight: string;
  metric_type: 'Higher is Better' | 'Lower is Better';
  created_at: string;
  updated_at: string;
}

export interface BAUMetricWithAchievement extends BAUMetric {
  achievement: number; // 0 to 100
}

export interface BAUActivityCreate {
  name: string;
  description?: string | null;
}

export interface BAUActivityUpdate {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface BAUMetricCreate {
  name: string;
  target_value: number | string;
  current_value?: number | string;
  unit: string;
  weight: number | string;
  metric_type?: 'Higher is Better' | 'Lower is Better';
}

export interface BAUActivityWithScore extends BAUActivity {
  metrics: BAUMetricWithAchievement[];
  activity_score: number; // 0 to 100
}

export interface BAUOverallHealth {
  team_id: number;
  activities: BAUActivityWithScore[];
  overall_health: number; // 0 to 100
  status: 'Excellent' | 'Good' | 'Acceptable' | 'Warning' | 'Poor';
}

// Work Item types
export interface WorkItem {
  id: number;
  team_id: number;
  monthly_headsup_id: number;
  title: string;
  description: string | null;
  source_type: 'OKR' | 'BAU';
  source_id: number;
  owner_id: number | null;
  month?: string; // Derived / legacy
  status: 'Not Started' | 'In Progress' | 'Completed';
  created_at: string;
  updated_at: string;
}

export interface WorkItemDetail extends WorkItem {
  owner: User | null;
  tasks: Task[];
}

export interface WorkItemCreate {
  title: string;
  monthly_headsup_id: number;
  description?: string | null;
  source_type: 'OKR' | 'BAU';
  source_id: number;
  owner_id?: number | null;
}

// Monthly Heads-Up types
export interface MonthlyHeadsUp {
  id: number;
  team_id: number;
  month: string; // "YYYY-MM"
  description: string;
  created_at: string;
  updated_at: string;
  work_items?: WorkItem[];
  weekly_priority_plans?: WeeklyPriorityPlan[];
}

export interface MonthlyHeadsUpCreate {
  month: string;
  description: string;
}

// Weekly Priority types - re-exported from priorities feature module
export type { WeeklyPriority, WeeklyPriorityCreate, WeeklyPriorityWithProgress, WeeklyPriorityPlan, WeeklyPriorityPlanCreate };

// Dashboard types
export interface Dashboard {
  team_id: number;
  okr_progress: number;
  bau_health: number;
  okrs: OKRWithScores[];
  all_okrs?: any[];
  monthly_headsup?: {
    id: number;
    description: string;
    month: string;
    work_items?: any[];
  } | null;
  bau_activities: BAUActivityWithScore[];
  current_week_priorities: WeeklyPriorityWithProgress[];
  weekly_plan?: WeeklyPriorityPlan | null;
  performance_trend?: PerformanceTrend[];
  updated_at: string;
  viewType?: 'team' | 'department' | 'executive';
}

export interface PerformanceTrend {
  date: string;
  okr_progress: number;
  bau_health: number;
}

// Snapshot types
// Team Member in snapshot
export interface SnapshotTeamMember {
  id: number;
  name: string;
  role: string;
  position?: string | null;
}

// OKR Key Result in snapshot
export interface SnapshotKeyResult {
  id: number;
  description: string;
  base: number;
  target: number;
  current: number;
  unit: string;
  weight: number;
  score: number;
}

// BAU Activity in snapshot
export interface SnapshotBAUActivity {
  id: number;
  name: string;
  score: number;
  metrics: Array<{
    name: string;
    target: number;
    current: number;
    achievement: number;
  }>;
}

// Work Item in snapshot
export interface SnapshotWorkItem {
  id: number;
  title: string;
  source_type: 'OKR' | 'BAU';
  source_name: string;
  priority: string;
}

// Weekly Priority Plan in snapshot
export interface SnapshotWeeklyPriorityPlan {
  week_focus: string;
  p1_items: Array<{ id: number; title: string }>;
  p2_items: Array<{ id: number; title: string }>;
  p3_items: Array<{ id: number; title: string }>;
}

// Task in snapshot
export interface SnapshotTask {
  id: number;
  description: string;
  title: string;
  assignee: string;
  status: string;
  work_item_id: number;
  effort_hours?: number | null;
}

export interface WeeklySnapshot {
  id: number;
  team_id: number;
  week: string;
  quarter: string;
  
  // Team Context
  team_name: string | null;
  team_size: number;
  manager_id: number | null;
  manager_name: string | null;
  team_members: SnapshotTeamMember[] | null;
  
  // OKR Context & Scores
  okr_id: number | null;
  okr_objective: string | null;
  okr_target_score: number | null;
  okr_current_score: number | null;
  okr_key_results: SnapshotKeyResult[] | null;
  
  // Legacy OKR fields (for backward compatibility)
  okr_objective_score: number | null;
  kr1_score: number | null;
  kr2_score: number | null;
  kr3_score: number | null;
  kr4_score: number | null;
  kr5_score: number | null;
  okr_data: any | null;
  
  // BAU Context & Scores
  bau_activities: SnapshotBAUActivity[] | null;
  bau_overall_health: number | null;
  bau_data: any | null; // Legacy field
  
  // Work Items
  work_items_planned: SnapshotWorkItem[] | null;
  work_items_completed: SnapshotWorkItem[] | null;
  work_items_count_planned: number;
  work_items_count_completed: number;
  work_items_completion_rate: number | null;
  
  // Weekly Priority Plan
  weekly_priority_plan: SnapshotWeeklyPriorityPlan | null;
  
  // Tasks
  tasks: SnapshotTask[] | null;
  tasks_count_planned: number;
  tasks_count_completed: number;
  tasks_completion_rate: number | null;
  
  // Legacy task fields
  tasks_planned: number;
  tasks_completed: number;
  
  // Metadata
  snapshot_version: string;
  created_at: string;
}

export interface WeeklySnapshotList {
  snapshots: WeeklySnapshot[];
  total: number;
}

export interface SnapshotTrend {
  week: string;
  okr_score: number | null;
  bau_health: number | null;
  work_items_completion_rate: number | null;
  tasks_completion_rate: number | null;
}

