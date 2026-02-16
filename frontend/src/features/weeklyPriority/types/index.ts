// Weekly Priority types
export interface WeeklyPriority {
  id: number;
  plan_id: number;
  work_item_id: number;
  priority: 1 | 2 | 3;
  created_at: string;
}

export interface WeeklyPriorityCreate {
  plan_id: number;
  work_item_id: number;
  priority: 1 | 2 | 3;
}

export interface WeeklyPriorityWithProgress {
  priority_id: number;
  work_item_id: number;
  work_item_name: string;
  priority: number;
  progress: number;
}

export interface WeeklyPriorityPlan {
  id: number;
  monthly_headsup_id: number;
  week: string;
  week_focus: string;
  created_at: string;
  updated_at: string;
  priorities?: WeeklyPriority[];
}

export interface WeeklyPriorityPlanCreate {
  monthly_headsup_id: number;
  week: string;
  week_focus: string;
}

