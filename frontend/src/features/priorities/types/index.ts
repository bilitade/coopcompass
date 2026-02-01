// Weekly Priority types
export interface WeeklyPriority {
  id: number;
  work_item_id: number;
  week: string;
  priority: 1 | 2 | 3;
  created_at: string;
}

export interface WeeklyPriorityCreate {
  work_item_id: number;
  week: string;
  priority: 1 | 2 | 3;
}

export interface WeeklyPriorityWithProgress {
  priority_id: number;
  work_item_id: number;
  work_item_name: string;
  priority: number;
  progress: number;
}

