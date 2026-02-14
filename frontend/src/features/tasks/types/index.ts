import type { User, WorkItem } from '../../../shared/types';

export interface Task {
    id: number;
    work_item_id: number;
    title: string;
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
    title: string;
    description: string;
    assignee_id?: number | null;
    effort_hours?: number | null;
}

export interface TaskUpdate {
    title?: string | null;
    description?: string | null;
    assignee_id?: number | null;
    status?: 'Not Started' | 'In Progress' | 'Done' | 'Blocked';
    effort_hours?: number | null;
    blocked_reason?: string | null;
}

export interface TaskWithWorkItem extends Task {
    work_item?: WorkItem;
    assignee?: User | null;
}
