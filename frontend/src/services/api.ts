import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type {
  User, UserCreate, UserLogin, TokenResponse,
  Department, DepartmentDetail, Team, TeamDetail,
  OKR, OKRDetail, OKRCreate, KeyResultCreate, KeyResult, OKRProgress, KRProgress,
  BAUActivity, BAUActivityDetail, BAUActivityCreate, BAUMetric, BAUMetricCreate, BAUHealth,
  WorkItem, WorkItemDetail, WorkItemCreate,
  Task, TaskDetail, TaskCreate, TaskUpdate,
  WeeklyPriority, WeeklyPriorityCreate,
  Dashboard, PerformanceTrend
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: UserCreate): Promise<User> {
    const response = await this.client.post<User>('/api/auth/register', data);
    return response.data;
  }

  async login(data: UserLogin): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/api/auth/login', data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/api/auth/me');
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/api/auth/logout');
  }

  // Department endpoints
  async getDepartments(): Promise<Department[]> {
    const response = await this.client.get<Department[]>('/api/departments');
    return response.data;
  }

  async getDepartment(deptId: number): Promise<DepartmentDetail> {
    const response = await this.client.get<DepartmentDetail>(`/api/departments/${deptId}`);
    return response.data;
  }

  async getDepartmentTeams(deptId: number): Promise<Team[]> {
    const response = await this.client.get<Team[]>(`/api/departments/${deptId}/teams`);
    return response.data;
  }

  async createDepartment(data: { name: string; description?: string; director_id?: number }): Promise<Department> {
    const response = await this.client.post<Department>('/api/departments', data);
    return response.data;
  }

  async updateDepartment(deptId: number, data: { name?: string; description?: string; director_id?: number }): Promise<Department> {
    const response = await this.client.put<Department>(`/api/departments/${deptId}`, data);
    return response.data;
  }

  async deleteDepartment(deptId: number): Promise<void> {
    await this.client.delete(`/api/departments/${deptId}`);
  }

  // Team endpoints
  async getTeams(): Promise<Team[]> {
    const response = await this.client.get<Team[]>('/api/teams');
    return response.data;
  }

  async createTeam(data: { name: string; department_id?: number }): Promise<Team> {
    const response = await this.client.post<Team>('/api/teams', data);
    return response.data;
  }

  async getTeam(teamId: number): Promise<TeamDetail> {
    const response = await this.client.get<TeamDetail>(`/api/teams/${teamId}`);
    return response.data;
  }

  async getTeamUsers(teamId: number): Promise<User[]> {
    const response = await this.client.get<User[]>(`/api/teams/${teamId}/users`);
    return response.data;
  }

  async getAvailableUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>('/api/teams/available-users/all');
    return response.data;
  }

  async addUserToTeam(teamId: number, userId: number): Promise<User> {
    const response = await this.client.post<User>(`/api/teams/${teamId}/users?user_id=${userId}`);
    return response.data;
  }

  async removeUserFromTeam(teamId: number, userId: number): Promise<void> {
    await this.client.delete(`/api/teams/${teamId}/users/${userId}`);
  }

  async updateTeam(teamId: number, data: { name?: string; department_id?: number }): Promise<Team> {
    const response = await this.client.put<Team>(`/api/teams/${teamId}`, data);
    return response.data;
  }

  async deleteTeam(teamId: number): Promise<void> {
    await this.client.delete(`/api/teams/${teamId}`);
  }

  // User endpoints
  async getUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>('/api/users');
    return response.data;
  }

  async getUserById(userId: number): Promise<User> {
    const response = await this.client.get<User>(`/api/users/${userId}`);
    return response.data;
  }

  async createUser(data: UserCreate): Promise<User> {
    const response = await this.client.post<User>('/api/users', data);
    return response.data;
  }

  async updateUser(userId: number, data: { name?: string; email?: string; role?: string; is_active?: boolean }): Promise<User> {
    const response = await this.client.put<User>(`/api/users/${userId}`, data);
    return response.data;
  }

  async deleteUser(userId: number): Promise<void> {
    await this.client.delete(`/api/users/${userId}`);
  }

  // OKR endpoints
  async createOKR(teamId: number, data: OKRCreate): Promise<OKR> {
    const response = await this.client.post<OKR>(`/api/okrs/teams/${teamId}/okrs`, data);
    return response.data;
  }

  async getTeamOKRs(teamId: number, quarter?: string): Promise<OKRDetail[]> {
    const response = await this.client.get<OKRDetail[]>(`/api/okrs/teams/${teamId}/okrs`, {
      params: quarter ? { quarter } : undefined,
    });
    return response.data;
  }

  async getOKR(okrId: number): Promise<OKRDetail> {
    const response = await this.client.get<OKRDetail>(`/api/okrs/${okrId}`);
    return response.data;
  }

  async updateOKR(okrId: number, data: { quarter?: string; objective?: string; is_active?: boolean }): Promise<OKR> {
    const response = await this.client.put<OKR>(`/api/okrs/${okrId}`, data);
    return response.data;
  }

  async deleteOKR(okrId: number): Promise<void> {
    await this.client.delete(`/api/okrs/${okrId}`);
  }

  async deleteKeyResult(krId: number): Promise<void> {
    await this.client.delete(`/api/okrs/key-results/${krId}`);
  }

  async createKeyResult(okrId: number, data: KeyResultCreate): Promise<KeyResult> {
    const response = await this.client.post<KeyResult>(`/api/okrs/${okrId}/key-results`, data);
    return response.data;
  }

  async updateKeyResult(krId: number, data: Partial<KeyResultCreate>): Promise<KeyResult> {
    const response = await this.client.put<KeyResult>(`/api/okrs/key-results/${krId}`, data);
    return response.data;
  }

  async getKRProgress(krId: number): Promise<KRProgress> {
    const response = await this.client.get<KRProgress>(`/api/okrs/${krId}/progress`);
    return response.data;
  }

  async getOKRProgress(okrId: number): Promise<OKRProgress> {
    const response = await this.client.get<OKRProgress>(`/api/okrs/${okrId}/progress`);
    return response.data;
  }

  // BAU endpoints
  async createBAUActivity(teamId: number, data: BAUActivityCreate): Promise<BAUActivity> {
    const response = await this.client.post<BAUActivity>(`/api/teams/${teamId}/bau`, data);
    return response.data;
  }

  async getTeamBAUActivities(teamId: number): Promise<BAUActivity[]> {
    const response = await this.client.get<BAUActivity[]>(`/api/teams/${teamId}/bau`);
    return response.data;
  }

  async getBAUActivity(bauId: number): Promise<BAUActivityDetail> {
    const response = await this.client.get<BAUActivityDetail>(`/api/bau/${bauId}`);
    return response.data;
  }

  async updateBAUActivity(bauId: number, data: Partial<BAUActivityCreate>): Promise<BAUActivity> {
    const response = await this.client.put<BAUActivity>(`/api/bau/${bauId}`, data);
    return response.data;
  }

  async createBAUMetric(bauId: number, data: BAUMetricCreate): Promise<BAUMetric> {
    const response = await this.client.post<BAUMetric>(`/api/bau/${bauId}/metrics`, data);
    return response.data;
  }

  async updateBAUMetric(metricId: number, data: Partial<BAUMetricCreate & { current_value?: number | string }>): Promise<BAUMetric> {
    const response = await this.client.patch<BAUMetric>(`/api/bau-metrics/${metricId}`, data);
    return response.data;
  }

  async getBAUHealth(bauId: number): Promise<BAUHealth> {
    const response = await this.client.get<BAUHealth>(`/api/bau/${bauId}/health`);
    return response.data;
  }

  async getBAUExecution(bauId: number): Promise<number> {
    const response = await this.client.get<number>(`/api/bau/${bauId}/execution`);
    return response.data;
  }

  async deleteBAUActivity(bauId: number): Promise<void> {
    await this.client.delete(`/api/bau/${bauId}`);
  }

  async deleteBAUMetric(metricId: number): Promise<void> {
    await this.client.delete(`/api/bau-metrics/${metricId}`);
  }

  async getBAUMetrics(bauId: number): Promise<BAUMetric[]> {
    const response = await this.client.get<BAUMetric[]>(`/api/bau/${bauId}/metrics`);
    return response.data;
  }

  async getBAUMetric(metricId: number): Promise<BAUMetric> {
    const response = await this.client.get<BAUMetric>(`/api/bau-metrics/${metricId}`);
    return response.data;
  }

  // Work Item endpoints
  async createWorkItem(data: WorkItemCreate): Promise<WorkItem> {
    const response = await this.client.post<WorkItem>('/api/work-items', data);
    return response.data;
  }

  async getWorkItems(filters?: { team_id?: number; month?: string; source_type?: string }): Promise<WorkItem[]> {
    const response = await this.client.get<WorkItem[]>('/api/work-items', { params: filters });
    return response.data;
  }

  async getWorkItemsWithSource(filters?: { team_id?: number; month?: string; source_type?: string }): Promise<any[]> {
    const response = await this.client.get<any[]>('/api/work-items-with-source', { params: filters });
    return response.data;
  }

  async getWorkItem(workItemId: number): Promise<WorkItemDetail> {
    const response = await this.client.get<WorkItemDetail>(`/api/work-items/${workItemId}`);
    return response.data;
  }

  async updateWorkItem(workItemId: number, data: { name?: string; description?: string; owner_id?: number }): Promise<WorkItem> {
    const response = await this.client.put<WorkItem>(`/api/work-items/${workItemId}`, data);
    return response.data;
  }

  // Task endpoints
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

  async getTeamTasks(teamId: number): Promise<Task[]> {
    const response = await this.client.get<Task[]>(`/api/teams/${teamId}/tasks`);
    return response.data;
  }

  // Weekly Priority endpoints
  async setWeeklyPriority(data: WeeklyPriorityCreate): Promise<WeeklyPriority> {
    const response = await this.client.post<WeeklyPriority>('/api/weekly-priorities', data);
    return response.data;
  }

  async getWeeklyPriorities(filters?: { week?: string; team_id?: number }): Promise<WeeklyPriority[]> {
    const response = await this.client.get<WeeklyPriority[]>('/api/weekly-priorities', { params: filters });
    return response.data;
  }

  async updateWeeklyPriority(priorityId: number, priority: 1 | 2 | 3): Promise<WeeklyPriority> {
    const response = await this.client.put<WeeklyPriority>(`/api/weekly-priorities/${priorityId}`, { priority });
    return response.data;
  }

  async deleteWeeklyPriority(priorityId: number): Promise<void> {
    await this.client.delete(`/api/weekly-priorities/${priorityId}`);
  }

  // Dashboard endpoints
  async getDashboard(teamId: number): Promise<Dashboard> {
    const response = await this.client.get<Dashboard>(`/api/teams/${teamId}/dashboard`);
    return response.data;
  }

  async getPerformanceTrend(teamId: number): Promise<PerformanceTrend[]> {
    const response = await this.client.get<PerformanceTrend[]>(`/api/teams/${teamId}/performance`);
    return response.data;
  }

  async getDepartmentDashboard(departmentId: number): Promise<any> {
    const response = await this.client.get<any>(`/api/departments/${departmentId}/dashboard`);
    return response.data;
  }

  async getOrganizationDashboard(): Promise<any> {
    const response = await this.client.get<any>(`/api/organization/dashboard`);
    return response.data;
  }
}

export const api = new ApiService();

