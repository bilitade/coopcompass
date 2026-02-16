import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type {
  User, UserCreate, UserLogin, TokenResponse,
  Department, DepartmentDetail, Team, TeamDetail,
  OKR, OKRDetail, OKRCreate, KeyResultCreate, KeyResult, OKRWithScores,
  BAUActivity, BAUActivityDetail, BAUActivityCreate, BAUActivityUpdate, BAUMetric, BAUMetricCreate,
  BAUActivityWithScore, BAUOverallHealth,
  WorkItem, WorkItemDetail, WorkItemCreate,
  WeeklyPriority, WeeklyPriorityCreate, WeeklyPriorityPlan, WeeklyPriorityPlanCreate,
  MonthlyHeadsUp, MonthlyHeadsUpCreate,
  MonthlyPlanOutput, MonthlyPlanGenerateResponse,
  WeeklyPlanOutput, WeeklyPlanGenerateResponse,
  TaskGenerationOutput, TaskGenerationGenerateResponse,
  Dashboard, PerformanceTrend,
  WeeklySnapshot, WeeklySnapshotList, SnapshotTrend
} from '../../shared/types';

// Use relative URL if VITE_API_URL is empty (for Docker/production with nginx proxy)
// Otherwise use the provided URL or default to localhost for development
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

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

  async createTeam(data: { name: string; description?: string; department_id?: number }): Promise<Team> {
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

  async updateTeam(teamId: number, data: { name?: string; description?: string; department_id?: number }): Promise<Team> {
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

  async updateUser(userId: number, data: { name?: string; email?: string; role?: string; position?: string; password?: string; is_active?: boolean }): Promise<User> {
    const response = await this.client.put<User>(`/api/users/${userId}`, data);
    return response.data;
  }

  async deleteUser(userId: number): Promise<void> {
    await this.client.delete(`/api/users/${userId}`);
  }

  // OKR endpoints
  async addOKR(data: OKRCreate): Promise<OKR> {
    const response = await this.client.post<OKR>('/api/okrs/add', data);
    return response.data;
  }

  async createOKR(teamId: number, data: OKRCreate): Promise<OKR> {
    const response = await this.client.post<OKR>(`/api/okrs/teams/${teamId}/okrs`, data);
    return response.data;
  }

  async getTeamOKRs(teamId: number, quarter?: string): Promise<OKRWithScores[]> {
    const response = await this.client.get<OKRWithScores[]>(`/api/okrs/teams/${teamId}/okrs`, {
      params: quarter ? { quarter } : undefined,
    });
    return response.data;
  }

  async getOKR(okrId: number): Promise<OKRDetail> {
    const response = await this.client.get<OKRDetail>(`/api/okrs/${okrId}`);
    return response.data;
  }

  async updateOKR(okrId: number, data: {
    okr_level?: 'strategic' | 'operational' | 'tactical';
    year?: number;
    quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    objective?: string;
    description?: string;
    status?: 'draft' | 'active' | 'completed';
    is_active?: boolean
  }): Promise<OKR> {
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

  async updateKeyResult(krId: number, data: Partial<KeyResultCreate & { current_value?: number | string }>): Promise<KeyResult> {
    const response = await this.client.put<KeyResult>(`/api/okrs/key-results/${krId}`, data);
    return response.data;
  }

  async updateKRCurrentValue(krId: number, currentValue: number | string): Promise<{ id: number; current_value: string; message: string }> {
    const response = await this.client.patch<{ id: number; current_value: string; message: string }>(
      `/api/okrs/key-results/${krId}/current-value`,
      null,
      { params: { current_value: currentValue } }
    );
    return response.data;
  }

  async getOKRWithScores(okrId: number): Promise<OKRWithScores> {
    const response = await this.client.get<OKRWithScores>(`/api/okrs/${okrId}/with-scores`);
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

  async updateBAUActivity(bauId: number, data: BAUActivityUpdate): Promise<BAUActivity> {
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

  async updateMetricCurrentValue(metricId: number, currentValue: number | string): Promise<{ id: number; current_value: string; message: string }> {
    const response = await this.client.patch<{ id: number; current_value: string; message: string }>(
      `/api/bau-metrics/${metricId}/current-value`,
      null,
      { params: { current_value: currentValue } }
    );
    return response.data;
  }

  async getBAUActivityWithScores(bauId: number): Promise<BAUActivityWithScore> {
    const response = await this.client.get<BAUActivityWithScore>(`/api/bau/${bauId}/with-scores`);
    return response.data;
  }

  async getTeamBAUHealth(teamId: number): Promise<BAUOverallHealth> {
    const response = await this.client.get<BAUOverallHealth>(`/api/teams/${teamId}/bau/health`);
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

  // Monthly Heads-Up endpoints
  async createMonthlyHeadsUp(teamId: number, data: MonthlyHeadsUpCreate): Promise<MonthlyHeadsUp> {
    const response = await this.client.post<MonthlyHeadsUp>(`/api/monthly-headsup/teams/${teamId}`, data);
    return response.data;
  }

  async getMonthlyHeadsUp(teamId: number, month: string): Promise<MonthlyHeadsUp> {
    const response = await this.client.get<MonthlyHeadsUp>(`/api/monthly-headsup/teams/${teamId}/${month}`);
    return response.data;
  }

  async updateMonthlyHeadsUp(headsupId: number, data: { description?: string; focus_areas?: string[]; strategic_alignment?: string; risks_and_considerations?: string[] }): Promise<MonthlyHeadsUp> {
    const response = await this.client.put<MonthlyHeadsUp>(`/api/monthly-headsup/${headsupId}`, data);
    return response.data;
  }

  async deleteMonthlyHeadsUp(headsupId: number): Promise<void> {
    await this.client.delete(`/api/monthly-headsup/${headsupId}`);
  }

  // Monthly Planner AI endpoints
  async generateMonthlyPlan(teamId: number, month: string): Promise<MonthlyPlanOutput> {
    const response = await this.client.post<MonthlyPlanOutput>(
      `/api/ai-engine/monthly-planner/generate`,
      {},
      { params: { team_id: teamId, month } }
    );
    return response.data;
  }

  async generateAndCreateMonthlyPlan(teamId: number, month: string, autoCreate: boolean = false): Promise<MonthlyPlanGenerateResponse> {
    const response = await this.client.post<MonthlyPlanGenerateResponse>(
      `/api/ai-engine/monthly-planner/generate-and-create`,
      {},
      { params: { team_id: teamId, month, auto_create: autoCreate } }
    );
    return response.data;
  }

  // Weekly Planner AI endpoints
  async generateWeeklyPlan(monthlyHeadsupId: number, week: string): Promise<WeeklyPlanOutput> {
    const response = await this.client.post<WeeklyPlanOutput>(
      `/api/ai-engine/weekly-planner/generate`,
      {},
      { params: { monthly_headsup_id: monthlyHeadsupId, week } }
    );
    return response.data;
  }

  async generateAndCreateWeeklyPlan(monthlyHeadsupId: number, week: string, autoCreate: boolean = false): Promise<WeeklyPlanGenerateResponse> {
    const response = await this.client.post<WeeklyPlanGenerateResponse>(
      `/api/ai-engine/weekly-planner/generate-and-create`,
      {},
      { params: { monthly_headsup_id: monthlyHeadsupId, week, auto_create: autoCreate } }
    );
    return response.data;
  }

  // Task Generator AI endpoints
  async generateTasks(weeklyPlanId: number, focusPriority?: number): Promise<TaskGenerationOutput> {
    const params: any = { weekly_plan_id: weeklyPlanId };
    if (focusPriority) params.focus_priority = focusPriority;
    const response = await this.client.post<TaskGenerationOutput>(
      `/api/ai-engine/task-generator/generate`,
      {},
      { params }
    );
    return response.data;
  }

  async generateAndCreateTasks(weeklyPlanId: number, focusPriority?: number, autoCreate: boolean = false): Promise<TaskGenerationGenerateResponse> {
    const params: any = { weekly_plan_id: weeklyPlanId, auto_create: autoCreate };
    if (focusPriority) params.focus_priority = focusPriority;
    const response = await this.client.post<TaskGenerationGenerateResponse>(
      `/api/ai-engine/task-generator/generate-and-create`,
      {},
      { params }
    );
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

  async updateWorkItem(workItemId: number, data: { title?: string; description?: string; owner_id?: number; status?: string }): Promise<WorkItem> {
    const response = await this.client.put<WorkItem>(`/api/work-items/${workItemId}`, data);
    return response.data;
  }

  async deleteWorkItem(workItemId: number): Promise<void> {
    await this.client.delete(`/api/work-items/${workItemId}`);
  }

  // Task endpoints
  async createTask(workItemId: number, data: { description: string; assignee_id?: number; effort_hours?: number }): Promise<any> {
    const response = await this.client.post<any>(`/api/work-items/${workItemId}/tasks`, data);
    return response.data;
  }

  async getTask(taskId: number): Promise<any> {
    const response = await this.client.get<any>(`/api/tasks/${taskId}`);
    return response.data;
  }

  async updateTask(taskId: number, data: { description?: string; assignee_id?: number; status?: string; effort_hours?: number; blocked_reason?: string }): Promise<any> {
    const response = await this.client.put<any>(`/api/tasks/${taskId}`, data);
    return response.data;
  }

  async deleteTask(taskId: number): Promise<void> {
    await this.client.delete(`/api/tasks/${taskId}`);
  }

  async getTasksByWorkItem(workItemId: number): Promise<any[]> {
    const response = await this.client.get<any[]>(`/api/work-items/${workItemId}/tasks`);
    return response.data;
  }

  async getUserTasks(userId: number): Promise<any[]> {
    const response = await this.client.get<any[]>(`/api/users/${userId}/tasks`);
    return response.data;
  }

  // Weekly Priority Plan endpoints
  async createWeeklyPriorityPlan(data: WeeklyPriorityPlanCreate): Promise<WeeklyPriorityPlan> {
    const response = await this.client.post<WeeklyPriorityPlan>('/api/weekly-priority/plans', data);
    return response.data;
  }

  async getWeeklyPriorityPlan(headsupId: number, week: string): Promise<WeeklyPriorityPlan> {
    const response = await this.client.get<WeeklyPriorityPlan>(`/api/weekly-priority/headsup/${headsupId}/plans/${week}`);
    return response.data;
  }

  async updateWeeklyPriorityPlan(planId: number, data: { week_focus: string }): Promise<WeeklyPriorityPlan> {
    const response = await this.client.put<WeeklyPriorityPlan>(`/api/weekly-priority/plans/${planId}`, data);
    return response.data;
  }

  // Weekly Priority endpoints
  async setWeeklyPriority(data: WeeklyPriorityCreate): Promise<WeeklyPriority> {
    const response = await this.client.post<WeeklyPriority>('/api/weekly-priority/priorities', data);
    return response.data;
  }

  async getWeeklyPriorities(planId: number): Promise<WeeklyPriority[]> {
    const response = await this.client.get<WeeklyPriority[]>(`/api/weekly-priority/plans/${planId}/priorities`);
    return response.data;
  }

  async updateWeeklyPriority(priorityId: number, priority: 1 | 2 | 3): Promise<WeeklyPriority> {
    const response = await this.client.put<WeeklyPriority>(`/api/weekly-priority/priorities/${priorityId}`, { priority });
    return response.data;
  }

  async deleteWeeklyPriority(priorityId: number): Promise<void> {
    await this.client.delete(`/api/weekly-priority/priorities/${priorityId}`);
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

  // Snapshot endpoints
  async createSnapshot(teamId: number, week?: string): Promise<WeeklySnapshot> {
    const params = week ? { week } : {};
    const response = await this.client.post<WeeklySnapshot>(
      `/api/snapshots/teams/${teamId}/create`,
      {},
      { params }
    );
    return response.data;
  }

  async getTeamSnapshots(
    teamId: number,
    quarter?: string,
    limit?: number
  ): Promise<WeeklySnapshotList> {
    const params: any = {};
    if (quarter) params.quarter = quarter;
    if (limit) params.limit = limit;
    const response = await this.client.get<WeeklySnapshotList>(
      `/api/snapshots/teams/${teamId}`,
      { params }
    );
    return response.data;
  }

  async getSnapshotByWeek(teamId: number, week: string): Promise<WeeklySnapshot> {
    const response = await this.client.get<WeeklySnapshot>(
      `/api/snapshots/teams/${teamId}/week/${week}`
    );
    return response.data;
  }

  async getSnapshotTrends(
    teamId: number,
    quarter?: string,
    limit?: number
  ): Promise<SnapshotTrend[]> {
    const params: any = {};
    if (quarter) params.quarter = quarter;
    if (limit) params.limit = limit;
    const response = await this.client.get<SnapshotTrend[]>(
      `/api/snapshots/teams/${teamId}/trends`,
      { params }
    );
    return response.data;
  }

  async createSnapshotsForAllTeams(week?: string): Promise<WeeklySnapshot[]> {
    const params = week ? { week } : {};
    const response = await this.client.post<WeeklySnapshot[]>(
      `/api/snapshots/create-all`,
      {},
      { params }
    );
    return response.data;
  }

  async deleteSnapshot(snapshotId: number): Promise<void> {
    await this.client.delete(`/api/snapshots/${snapshotId}`);
  }
}

export const api = new ApiService();

