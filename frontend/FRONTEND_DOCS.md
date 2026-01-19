# TPES Frontend - Complete Documentation

**Team Performance & Execution System - Frontend Application**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Features](#features)
6. [Configuration](#configuration)
7. [Development Guide](#development-guide)
8. [API Integration](#api-integration)
9. [Component Documentation](#component-documentation)
10. [Styling Guide](#styling-guide)
11. [Build & Deployment](#build--deployment)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The TPES Frontend is a modern React application built with TypeScript that provides a comprehensive interface for managing team performance through OKRs (Objectives and Key Results) and BAU (Business As Usual) activities.

### Key Capabilities

✅ **Authentication** - Secure JWT-based login and registration  
✅ **Real-time Dashboard** - Live metrics and progress tracking  
✅ **OKR Management** - Create and track quarterly objectives  
✅ **BAU Management** - Monitor operational health metrics  
✅ **Work Items** - Plan and execute monthly deliverables  
✅ **Weekly Planning** - Prioritize and organize weekly work  
✅ **Analytics** - Visual progress indicators and charts

---

## Quick Start

### Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- npm 9+
- Backend API running on `http://localhost:8000`

### Installation & Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at: **http://localhost:5173**

### Quick Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework |
| TypeScript | 5.9.x | Type safety |
| Vite | 4.5.x | Build tool & dev server |
| React Router | 6.21.x | Client-side routing |
| Tailwind CSS | 3.4.x | Utility-first styling |
| Axios | 1.13.x | HTTP client |
| Recharts | 3.6.x | Data visualization |
| Lucide React | 0.562.x | Icon library |

### Architecture Decisions

- **No complex state management** - Uses React Context API for simplicity
- **Type-safe** - Full TypeScript coverage
- **Component-based** - Modular, reusable components
- **API-first** - Clean separation between UI and data layers

---

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Alert.tsx        # Success/error alerts
│   │   ├── Layout.tsx       # Page layout wrapper
│   │   ├── LoadingSpinner.tsx
│   │   ├── Modal.tsx        # Modal dialogs
│   │   ├── Navbar.tsx       # Navigation bar
│   │   └── ProtectedRoute.tsx
│   │
│   ├── context/            # React Context providers
│   │   └── AuthContext.tsx # Authentication state
│   │
│   ├── pages/              # Page components (routes)
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── OKRPage.tsx
│   │   ├── BAUPage.tsx
│   │   ├── WorkItemsPage.tsx
│   │   └── PlanningPage.tsx
│   │
│   ├── services/           # External integrations
│   │   └── api.ts          # Backend API client
│   │
│   ├── types/              # TypeScript definitions
│   │   └── index.ts        # All type definitions
│   │
│   ├── App.tsx             # Main app with routing
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
│
├── public/                 # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS config
├── vite.config.ts          # Vite configuration
└── README.md               # This file
```

---

## Features

### 1. Authentication System

**Login & Registration**
- Email/password authentication
- JWT token management
- Automatic token refresh
- Role-based access (member, lead, executive)

**Security**
- Tokens stored in localStorage
- Auto-redirect on expiration
- Protected routes for authenticated users

### 2. Dashboard

**Real-time Metrics**
- OKR progress percentage
- BAU health scores
- Current week priorities
- Visual progress bars

**Components**
- Metric cards with color coding
- Progress indicators
- Key results breakdown
- BAU activity health

### 3. OKR Management

**Capabilities**
- Create quarterly OKRs
- Add multiple key results per OKR
- Set targets with units
- Auto-calculated progress
- Visual progress tracking

**Workflow**
1. Create OKR with objective and quarter
2. Add key results with targets
3. Progress updates automatically from work items
4. View detailed breakdowns

### 4. BAU Management

**Features**
- Define operational activities
- Set weighted metrics
- Higher/lower is better logic
- Real-time health scoring
- Update metric values

**Health Calculation**
- Weighted average of all metrics
- Achievement percentage per metric
- Color-coded health indicators
- Historical value tracking

### 5. Work Items

**Management**
- Create from OKRs or BAU activities
- Monthly planning cycles
- Break down into tasks
- Assign team members
- Track completion status

**Task Tracking**
- Four states: Not Started, In Progress, Done, Blocked
- Effort estimation in hours
- Status updates
- Progress calculation

### 6. Weekly Planning

**Priority System**
- P1 (Critical) - Must complete this week
- P2 (Important) - Should complete this week
- P3 (Nice to Have) - Start if time permits

**Features**
- Select work items for the week
- Set priority levels
- View prioritized work
- Remove priorities

---

## Configuration

### Environment Variables

Create a `.env` file in the frontend root:

```env
# Backend API URL
VITE_API_URL=http://localhost:8000
```

**Production Example:**
```env
VITE_API_URL=https://api.yourcompany.com
```

### Tailwind Configuration

Located in `tailwind.config.js`:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          // Custom primary color palette
        },
      },
    },
  },
}
```

---

## Development Guide

### Adding a New Page

1. **Create Page Component**
```typescript
// src/pages/NewPage.tsx
import React from 'react';
import { Layout } from '../components/Layout';

export const NewPage: React.FC = () => {
  return (
    <Layout>
      <h1>New Page</h1>
    </Layout>
  );
};
```

2. **Add Route**
```typescript
// src/App.tsx
import { NewPage } from './pages/NewPage';

// In Routes:
<Route
  path="/new"
  element={
    <ProtectedRoute>
      <NewPage />
    </ProtectedRoute>
  }
/>
```

3. **Add Navigation Link**
```typescript
// src/components/Navbar.tsx
<NavLink to="/new" icon={<Icon />}>New Page</NavLink>
```

### Creating Components

**Template:**
```typescript
import React from 'react';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div className="card">
      <h2>{title}</h2>
      {onAction && (
        <button onClick={onAction} className="btn btn-primary">
          Action
        </button>
      )}
    </div>
  );
};
```

### State Management Pattern

```typescript
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [success, setSuccess] = useState('');

useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  try {
    const result = await api.getData();
    setData(result);
  } catch (err: any) {
    setError(err.response?.data?.detail || 'Failed to load data');
  } finally {
    setLoading(false);
  }
};
```

---

## API Integration

### API Service Layer

All API calls go through `src/services/api.ts`:

```typescript
import { api } from '../services/api';

// Example usage
const teams = await api.getTeams();
const dashboard = await api.getDashboard(teamId);
const okr = await api.createOKR(teamId, okrData);
```

### Available Methods

**Authentication**
- `api.register(userData)` - Create new user
- `api.login(credentials)` - Authenticate user
- `api.getCurrentUser()` - Get current user info
- `api.logout()` - End session

**Teams**
- `api.getTeams()` - List all teams
- `api.createTeam(name)` - Create team
- `api.getTeam(teamId)` - Get team details
- `api.getTeamUsers(teamId)` - List team members

**OKRs**
- `api.createOKR(teamId, data)` - Create OKR
- `api.getTeamOKRs(teamId, quarter?)` - List OKRs
- `api.getOKR(okrId)` - Get OKR details
- `api.updateOKR(okrId, data)` - Update OKR
- `api.createKeyResult(okrId, data)` - Add key result
- `api.getOKRProgress(okrId)` - Get progress

**BAU**
- `api.createBAUActivity(teamId, data)` - Create activity
- `api.getTeamBAUActivities(teamId)` - List activities
- `api.getBAUActivity(bauId)` - Get details
- `api.createBAUMetric(bauId, data)` - Add metric
- `api.updateBAUMetric(metricId, data)` - Update metric
- `api.getBAUHealth(bauId)` - Get health score

**Work Items & Tasks**
- `api.createWorkItem(data)` - Create work item
- `api.getWorkItems(filters)` - List work items
- `api.getWorkItem(workItemId)` - Get details
- `api.createTask(workItemId, data)` - Add task
- `api.updateTask(taskId, data)` - Update task status

**Planning**
- `api.setWeeklyPriority(data)` - Set priority
- `api.getWeeklyPriorities(filters)` - List priorities
- `api.deleteWeeklyPriority(priorityId)` - Remove priority

**Dashboard**
- `api.getDashboard(teamId)` - Get dashboard data
- `api.getPerformanceTrend(teamId)` - Get trends

### Error Handling

```typescript
try {
  const data = await api.someMethod();
  setSuccess('Operation successful');
  setData(data);
} catch (err: any) {
  const message = err.response?.data?.detail || 'Operation failed';
  setError(message);
}
```

---

## Component Documentation

### Layout Components

**Layout**
```typescript
<Layout>
  {/* Your page content */}
</Layout>
```
Provides consistent page structure with navbar.

**ProtectedRoute**
```typescript
<ProtectedRoute>
  <YourPage />
</ProtectedRoute>
```
Redirects to login if not authenticated.

### UI Components

**Alert**
```typescript
<Alert 
  type="success" | "error" | "warning" | "info"
  message="Your message"
  onClose={() => setError('')}
/>
```

**Modal**
```typescript
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Modal Title"
  size="sm" | "md" | "lg" | "xl"
>
  {/* Modal content */}
</Modal>
```

**LoadingSpinner**
```typescript
<LoadingSpinner size={24} />
```

---

## Styling Guide

### Tailwind Utility Classes

**Custom Classes (in index.css)**

```css
/* Buttons */
.btn                 /* Base button */
.btn-primary         /* Primary action button */
.btn-secondary       /* Secondary button */
.btn-danger          /* Destructive action */

/* Layout */
.card                /* Card container */

/* Forms */
.input               /* Input field */
.label               /* Form label */
```

### Usage Examples

```tsx
// Primary button
<button className="btn btn-primary">
  Save
</button>

// Card with content
<div className="card">
  <h2 className="text-xl font-semibold">Title</h2>
  <p className="text-gray-600">Description</p>
</div>

// Input field
<div>
  <label className="label">Name</label>
  <input type="text" className="input" />
</div>
```

### Color Palette

- **Primary**: Blue shades (primary-50 to primary-900)
- **Success**: Green shades
- **Warning**: Yellow shades
- **Error**: Red shades
- **Gray**: Neutral tones

---

## Build & Deployment

### Development Build

```bash
npm run dev
```
- Hot module replacement
- Source maps enabled
- Runs on port 5173

### Production Build

```bash
npm run build
```
- TypeScript type checking
- Minification
- Tree shaking
- Output in `dist/` folder

### Preview Production

```bash
npm run preview
```
Test the production build locally.

### Deployment Options

**Vercel (Recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variable
vercel env add VITE_API_URL production
```

**Netlify**
```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables
VITE_API_URL=https://your-backend-url
```

**Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
```

---

## Troubleshooting

### Common Issues

**1. API Connection Errors**
```
Problem: Cannot connect to backend
Solution: 
- Verify backend is running on http://localhost:8000
- Check .env file has correct VITE_API_URL
- Check browser console for CORS errors
```

**2. Authentication Errors**
```
Problem: Automatic logout or 401 errors
Solution:
- Clear localStorage: localStorage.clear()
- Check token expiration
- Verify backend SECRET_KEY matches
```

**3. Build Errors**
```
Problem: TypeScript compilation errors
Solution:
- Run: npm install
- Check all imports use 'type' for types
- Verify all dependencies are installed
```

**4. Styling Not Applied**
```
Problem: Tailwind classes not working
Solution:
- Verify tailwind.config.js exists
- Check postcss.config.js is present
- Restart dev server after config changes
```

**5. Module Not Found**
```
Problem: Cannot find module errors
Solution:
- Delete node_modules and package-lock.json
- Run: npm install
- Restart dev server
```

### Debug Mode

Add to your component:
```typescript
useEffect(() => {
  console.log('Component mounted');
  console.log('Props:', props);
  console.log('State:', state);
}, []);
```

### API Debug

```typescript
// In api.ts, add logging interceptor
this.client.interceptors.response.use(
  (response) => {
    console.log('API Response:', response);
    return response;
  }
);
```

---

## Performance Tips

1. **Lazy Loading**
```typescript
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
```

2. **Memoization**
```typescript
const memoizedValue = useMemo(() => expensiveCalculation(), [deps]);
const memoizedCallback = useCallback(() => { }, [deps]);
```

3. **Image Optimization**
- Use WebP format
- Lazy load images
- Use appropriate sizes

---

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ⚠️ IE 11 (not supported)

---

## Best Practices

### Code Organization
- One component per file
- Group related components in folders
- Use barrel exports (index.ts)

### Naming Conventions
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types: PascalCase with 'Type' suffix

### TypeScript
- Always define prop types
- Use `type` for imports
- Avoid `any` type
- Use strict mode

### State Management
- Keep state close to where it's used
- Lift state up only when needed
- Use Context for global state
- Avoid prop drilling

---

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Router](https://reactrouter.com)

---

## License

Internal use only

---

**Last Updated:** January 2026  
**Version:** 1.0.0  
**Maintainer:** Development Team

