import axios, { type AxiosInstance } from 'axios';
import type { Task, TaskCreate, TaskUpdate, TaskDetail, TaskWithWorkItem } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class TasksApiService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.client.interceptors.request.use((config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    async createTask(workItemId: number, data: TaskCreate): Promise<Task> {
        const response = await this.client.post<Task>(`/api/work-items/${workItemId}/tasks`, data);
        return response.data;
    }

    async getTask(taskId: number): Promise<TaskDetail> {
        const response = await this.client.get<TaskDetail>(`/api/tasks/${taskId}`);
        return response.data;
    }

    async updateTask(taskId: number, data: TaskUpdate): Promise<Task> {
        const response = await this.client.patch<Task>(`/api/tasks/${taskId}`, data);
        return response.data;
    }

    async getUserTasks(userId: number, status?: string): Promise<Task[]> {
        const response = await this.client.get<Task[]>(`/api/users/${userId}/tasks`, {
            params: status ? { status } : undefined,
        });
        return response.data;
    }

    async getTeamTasks(teamId: number): Promise<TaskWithWorkItem[]> {
        const response = await this.client.get<TaskWithWorkItem[]>(`/api/teams/${teamId}/tasks`);
        return response.data;
    }

    async getPrioritizedWorkItems(teamId: number): Promise<any[]> {
        const response = await this.client.get<any[]>(`/api/teams/${teamId}/prioritized-work-items`);
        return response.data;
    }
}

export const tasksApi = new TasksApiService();
