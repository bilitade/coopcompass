# Frontend Update Guide

## Overview
This guide details all the changes needed in the frontend to work with the updated backend API.

---

## Changes Made to Shared Types

### 1. OKR Types (`/frontend/src/shared/types/index.ts`)

**Updated KeyResult Interface:**
```typescript
export interface KeyResult {
  id: number;
  okr_id: number;
  description: string;
  base_value: string;        // NEW - baseline value
  target_value: string;
  current_value: string;
  unit: string;              // NOW REQUIRED (was optional)
  weight: string;            // NEW - importance (0.0-1.0)
  created_at: string;
  updated_at: string;
}
```

**New KeyResultWithScore Interface:**
```typescript
export interface KeyResultWithScore extends KeyResult {
  score: number; // 0.0 to 1.0
}
```

**Updated KeyResultCreate Interface:**
```typescript
export interface KeyResultCreate {
  description: string;
  base_value: number | string;    // NEW - required
  target_value: number | string;
  current_value?: number | string; // Optional (defaults to base_value)
  unit: string;                    // NOW REQUIRED
  weight: number | string;         // NEW - required
}
```

**New OKRWithScores Interface:**
```typescript
export interface OKRWithScores extends OKR {
  key_results: KeyResultWithScore[];
  objective_score: number;  // 0.0 to 1.0
  status: 'Green' | 'Yellow' | 'Red';
}
```

**Removed Interfaces:**
- `KRProgress` - Use `KeyResultWithScore` instead
- `OKRProgress` - Use `OKRWithScores` instead

---

### 2. BAU Types (`/frontend/src/shared/types/index.ts`)

**Updated BAUMetric Interface:**
```typescript
export interface BAUMetric {
  id: number;
  bau_activity_id: number;
  name: string;
  target_value: string;
  current_value: string;
  unit: string;                                    // NOW REQUIRED
  weight: string;
  metric_type: 'higher_better' | 'lower_better';  // CHANGED from is_higher_better: boolean
  created_at: string;
  updated_at: string;
}
```

**New BAUMetricWithAchievement Interface:**
```typescript
export interface BAUMetricWithAchievement extends BAUMetric {
  achievement: number; // 0 to 100
}
```

**Updated BAUMetricCreate Interface:**
```typescript
export interface BAUMetricCreate {
  name: string;
  target_value: number | string;
  current_value?: number | string;                // Optional (defaults to 0)
  unit: string;                                    // NOW REQUIRED
  weight: number | string;                         // NOW REQUIRED
  metric_type?: 'higher_better' | 'lower_better'; // CHANGED
}
```

**New BAUActivityWithScore Interface:**
```typescript
export interface BAUActivityWithScore extends BAUActivity {
  metrics: BAUMetricWithAchievement[];
  activity_score: number; // 0 to 100
}
```

**New BAUOverallHealth Interface:**
```typescript
export interface BAUOverallHealth {
  team_id: number;
  activities: BAUActivityWithScore[];
  overall_health: number; // 0 to 100
  status: 'Excellent' | 'Good' | 'Acceptable' | 'Warning' | 'Poor';
}
```

**Removed Interface:**
- `BAUHealth` - Use `BAUActivityWithScore` and `BAUOverallHealth` instead

---

### 3. Work Item Types (`/frontend/src/shared/types/index.ts`)

**Updated WorkItem Interface:**
```typescript
export interface WorkItem {
  id: number;
  team_id: number;
  title: string;  // CHANGED from 'name'
  description: string | null;
  source_type: 'OKR' | 'BAU';
  source_id: number;
  owner_id: number | null;
  month: string;
  status: 'Not Started' | 'In Progress' | 'Completed';  // NEW
  created_at: string;
  updated_at: string;
}
```

**Updated WorkItemCreate Interface:**
```typescript
export interface WorkItemCreate {
  title: string;  // CHANGED from 'name'
  description?: string | null;
  source_type: 'OKR' | 'BAU';
  source_id: number;
  owner_id?: number | null;
  month: string;
}
```

---

## Changes Made to API Service

### 1. OKR Endpoints (`/frontend/src/shared/services/api.ts`)

**New Methods:**
```typescript
// Update only the current value (weekly update by Manager)
async updateKRCurrentValue(krId: number, currentValue: number | string): Promise<{ id: number; current_value: string; message: string }>

// Get OKR with calculated scores
async getOKRWithScores(okrId: number): Promise<OKRWithScores>
```

**Removed Methods:**
- `getKRProgress(krId)` - Use `getOKRWithScores(okrId)` instead
- `getOKRProgress(okrId)` - Use `getOKRWithScores(okrId)` instead

**Updated Method Signatures:**
```typescript
// Updated to support new fields
async updateKeyResult(krId: number, data: Partial<KeyResultCreate & { current_value?: number | string }>): Promise<KeyResult>
```

---

### 2. BAU Endpoints (`/frontend/src/shared/services/api.ts`)

**New Methods:**
```typescript
// Update only the current value (weekly update by Manager)
async updateMetricCurrentValue(metricId: number, currentValue: number | string): Promise<{ id: number; current_value: string; message: string }>

// Get BAU activity with calculated scores
async getBAUActivityWithScores(bauId: number): Promise<BAUActivityWithScore>

// Get team's overall BAU health
async getTeamBAUHealth(teamId: number): Promise<BAUOverallHealth>
```

**Removed Methods:**
- `getBAUHealth(bauId)` - Use `getBAUActivityWithScores(bauId)` instead
- `getBAUExecution(bauId)` - Removed (not in spec)

---

### 3. Work Item Endpoints (`/frontend/src/shared/services/api.ts`)

**Updated Method Signature:**
```typescript
// Updated to support 'title' instead of 'name' and new 'status' field
async updateWorkItem(workItemId: number, data: { 
  title?: string;      // CHANGED from 'name'
  description?: string; 
  owner_id?: number;
  status?: string;     // NEW
}): Promise<WorkItem>
```

---

## Required Frontend Component Updates

### OKR Components

**Files to Update:**
- `/frontend/src/features/okrs/pages/OKRPage.tsx`

**Changes Needed:**

1. **Form State Updates:**
```typescript
// Old:
const [krForm, setKrForm] = useState({ 
  description: '', 
  target_value: '', 
  unit: '' 
});

// New:
const [krForm, setKrForm] = useState({ 
  description: '', 
  base_value: '',     // NEW
  target_value: '', 
  current_value: '',  // NEW (optional)
  unit: '',
  weight: ''          // NEW
});
```

2. **Add Form Fields:**
- Add `base_value` input field
- Add `weight` input field (with validation that all weights sum to 1.0)
- Make `unit` field required

3. **Display Updates:**
- Show `base_value` in KR display
- Show `weight` in KR display
- Calculate and display KR score: `(current - base) / (target - base)`
- Show status color based on objective score

4. **Use New API Endpoints:**
```typescript
// Instead of getOKRProgress:
const okrWithScores = await api.getOKRWithScores(okrId);
// Display okrWithScores.objective_score and okrWithScores.status
```

---

### BAU Components

**Files to Update:**
- `/frontend/src/features/bau/pages/BAUPage.tsx`

**Changes Needed:**

1. **Form State Updates:**
```typescript
// Old:
const [metricForm, setMetricForm] = useState({ 
  name: '',
  target_value: '',
  unit: '',
  weight: '1.0',
  is_higher_better: true
});

// New:
const [metricForm, setMetricForm] = useState({ 
  name: '',
  target_value: '',
  current_value: '0',  // NEW (optional, defaults to 0)
  unit: '',
  weight: '',
  metric_type: 'higher_better'  // CHANGED from is_higher_better
});
```

2. **Form Field Changes:**
- Change `is_higher_better` checkbox to `metric_type` dropdown/radio:
  - Options: "Higher is Better" (`higher_better`) or "Lower is Better" (`lower_better`)
- Make `unit` field required
- Make `weight` field required (with validation that all weights sum to 1.0)

3. **Display Updates:**
- Show metric achievement percentage (0-100%)
- Show activity score (0-100%)
- Show overall BAU health with status badge

4. **Use New API Endpoints:**
```typescript
// Instead of getBAUHealth:
const activityWithScores = await api.getBAUActivityWithScores(bauId);
// Display activityWithScores.activity_score and metric achievements

// For team overview:
const teamHealth = await api.getTeamBAUHealth(teamId);
// Display teamHealth.overall_health and teamHealth.status
```

---

### Work Item Components

**Files to Update:**
- `/frontend/src/features/workItems/pages/WorkItemsPage.tsx`
- `/frontend/src/features/workItems/pages/TasksPage.tsx`

**Changes Needed:**

1. **Form State Updates:**
```typescript
// Old:
const [workItemForm, setWorkItemForm] = useState({ 
  name: '',
  description: '',
  source_type: 'OKR',
  source_id: 0,
  owner_id: null,
  month: ''
});

// New:
const [workItemForm, setWorkItemForm] = useState({ 
  title: '',        // CHANGED from 'name'
  description: '',
  source_type: 'OKR',
  source_id: 0,
  owner_id: null,
  month: ''
});
```

2. **Display Updates:**
- Change all references from `workItem.name` to `workItem.title`
- Display `workItem.status` badge ("Not Started", "In Progress", "Completed")
- Add status update functionality

3. **Table/List Updates:**
- Update column headers from "Name" to "Title"
- Add "Status" column

---

## Status Badges and Colors

### OKR Status Colors
```typescript
const getOKRStatusColor = (status: string) => {
  switch(status) {
    case 'Green': return 'bg-green-100 text-green-800';
    case 'Yellow': return 'bg-yellow-100 text-yellow-800';
    case 'Red': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
```

### BAU Status Colors
```typescript
const getBAUStatusColor = (status: string) => {
  switch(status) {
    case 'Excellent': return 'bg-green-100 text-green-800';
    case 'Good': return 'bg-green-100 text-green-700';
    case 'Acceptable': return 'bg-yellow-100 text-yellow-800';
    case 'Warning': return 'bg-orange-100 text-orange-800';
    case 'Poor': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
```

---

## Weight Validation Helper

Add this helper function to validate weights:

```typescript
export const validateWeights = (weights: number[]): { valid: boolean; total: number; error?: string } => {
  const total = weights.reduce((sum, w) => sum + w, 0);
  const valid = Math.abs(total - 1.0) <= 0.01; // Allow small tolerance for floating point
  
  return {
    valid,
    total,
    error: valid ? undefined : `Weights must sum to 1.0 (currently ${total.toFixed(3)})`
  };
};
```

---

## Score Calculation Helpers

Add these helpers for displaying scores:

```typescript
// Calculate KR score
export const calculateKRScore = (base: number, target: number, current: number): number => {
  if (target === base) return current >= target ? 1.0 : 0.0;
  const score = (current - base) / (target - base);
  return Math.max(0, Math.min(1, score)); // Clamp to [0, 1]
};

// Calculate BAU metric achievement
export const calculateMetricAchievement = (
  target: number, 
  current: number, 
  type: 'higher_better' | 'lower_better'
): number => {
  if (type === 'higher_better') {
    return Math.min((current / target) * 100, 100);
  } else {
    return Math.min((target / current) * 100, 100);
  }
};

// Format score as percentage
export const formatScore = (score: number): string => {
  return `${(score * 100).toFixed(1)}%`;
};

// Format achievement percentage
export const formatAchievement = (achievement: number): string => {
  return `${achievement.toFixed(1)}%`;
};
```

---

## Migration Checklist

### Phase 1: Update Types and Services ✅
- [x] Update shared types in `/frontend/src/shared/types/index.ts`
- [x] Update API service in `/frontend/src/shared/services/api.ts`

### Phase 2: Update OKR Components
- [ ] Update OKRPage.tsx
  - [ ] Add base_value and weight fields to forms
  - [ ] Update KR display to show new fields
  - [ ] Replace progress endpoints with score endpoints
  - [ ] Add score calculations and status displays
- [ ] Update any OKR-related components in `/frontend/src/features/okrs/components/`

### Phase 3: Update BAU Components
- [ ] Update BAUPage.tsx
  - [ ] Change is_higher_better to metric_type
  - [ ] Add weight validation
  - [ ] Update metric display to show achievement
  - [ ] Replace health endpoints with score endpoints
  - [ ] Add score calculations and status displays
- [ ] Update any BAU-related components in `/frontend/src/features/bau/components/`

### Phase 4: Update Work Item Components
- [ ] Update WorkItemsPage.tsx
  - [ ] Change 'name' to 'title' everywhere
  - [ ] Add status field display and editing
- [ ] Update TasksPage.tsx
  - [ ] Update to use 'title' field
- [ ] Update any work-item-related components

### Phase 5: Update Dashboard Components
- [ ] Update UnifiedDashboard.tsx
  - [ ] Use new OKRWithScores type
  - [ ] Use new BAUActivityWithScore type
  - [ ] Update score displays
- [ ] Remove or disable director/executive dashboards (not needed for team-stage)

### Phase 6: Testing
- [ ] Test OKR creation with new fields
- [ ] Test BAU metric creation with new metric_type
- [ ] Test weight validation
- [ ] Test work item creation with title field
- [ ] Test score calculations display correctly
- [ ] Test weekly updates (updateKRCurrentValue, updateMetricCurrentValue)

---

## Breaking Changes Summary

1. **KeyResult** now requires `base_value`, `weight`, and `unit` (no longer optional)
2. **BAUMetric** now uses `metric_type` string instead of `is_higher_better` boolean
3. **WorkItem** now uses `title` instead of `name` and has `status` field
4. Progress endpoints replaced with score endpoints
5. Health endpoints replaced with score and overall health endpoints

---

## Backward Compatibility Notes

- Old data without `base_value` and `weight` will cause errors
- Database was reset, so no migration needed
- All old components using progress/health endpoints need updating

---

## Testing the Frontend

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Test with backend:**
- Backend should be running on `http://localhost:8000`
- Frontend will be on `http://localhost:5173`
- Login with test credentials from backend

---

## Next Steps

1. Update OKR components (highest priority)
2. Update BAU components
3. Update Work Item components
4. Add helper functions for calculations
5. Add status badges
6. Test all functionality thoroughly

