# System Info - Nokta Academy Management System

## Project Architecture

The Nokta Academy Management System is a full-stack application with a clear separation between frontend and backend components.

### Overall Architecture
- **Frontend**: React 18 with Vite, TypeScript, Tailwind CSS for styling, Zustand for state management, React Query for server state, React Router for routing, i18next for internationalization, Framer Motion for animations, Lucide React for icons, and PWA support via Vite PWA plugin.
- **Backend**: Node.js with Express.js, TypeScript, MongoDB with Mongoose ODM, JWT for authentication, bcryptjs for password hashing, Joi for validation, Helmet for security headers, CORS for cross-origin requests, and express-rate-limit for rate limiting.
- **Shared**: Root-level files include README.md (project overview), account/ (user credentials and notes), All_project_info/, Copilote_command_Last_run/, Project_syntax_created/, and uploads/ (profile images).

### Frontend-Backend Connection
- Frontend communicates with backend via Axios HTTP client configured in `frontend/src/services/api.ts` with base URL `http://localhost:8081/api`.
- API calls are RESTful, returning JSON responses with a consistent structure: `{ success: boolean, data: any, message: string, meta?: any }`.
- Error handling includes network errors, 4xx/5xx responses, and loading states.

### API Flow
- Requests flow from frontend components/services → Axios → backend routes → controllers/services → database models → responses back.
- Example: Login from `frontend/src/features/auth/pages/LoginPage.tsx` calls `authService.login()` → POST `/api/auth/login` → `auth.routes.ts` → User model query → JWT token response → stored in localStorage → redirects to dashboard.

### Authentication Flow
- Login: User submits email/password → backend validates against User model (bcrypt compare) → generates JWT access/refresh tokens → stores in localStorage.
- Profile: On app load, checks tokens → calls GET `/api/auth/profile` → verifies JWT → returns user data → sets Zustand auth state.
- Logout: Clears localStorage tokens → resets auth state → redirects to login.
- Refresh: Uses refresh token to get new access token if expired.

### RBAC Flow
- Roles: super_admin, admin, teacher, student, family_student, accountant, librarian.
- Permissions: Defined in `backend/src/utils/roles.ts` and `frontend/src/features/resources/config/modules.ts`, checked via `authorize()` middleware in routes.
- ACL: Additional access control in controllers (e.g., students can only view own data via `req.user.userId` filtering).
- Example: Student views results → GET `/api/results` → `authorize(['student'])` passes → controller filters `filter.student = req.user.userId`.

### Database Relations
- **User Model** (`backend/src/models/User.ts`): Central model for all user types (role field differentiates). Relations: teacherId (for students), familyId (for students/family_students).
- **Class Model** (`backend/src/models/Class.ts`): Has subjects array (ObjectIds), assignedTeachers array.
- **Subject Model** (`backend/src/models/Subject.ts`): References classId, teacher (User ObjectId).
- **Exam/Result Models**: Exam references subject/class, Result references student/exam.
- **Family Model**: References students array (User ObjectIds).
- Relations use Mongoose populate for joins (e.g., GET students populates classId/subjectId/teacherId).

### Folder Breakdown
- **Frontend (`frontend/`)**:
  - `src/app/`: App.tsx (main component), main.tsx (entry), providers/ (theme, etc.).
  - `src/components/`: UI components (Card, Button, etc.).
  - `src/features/`: Feature modules (auth/, dashboard/, resources/, users/).
  - `src/layouts/`: AppShell, DashboardLayout.
  - `src/pages/`: HomePage, NotFoundPage, etc.
  - `src/routes/`: AppRoutes.tsx (routing logic).
  - `src/services/`: API service.
  - `src/store/`: Zustand stores (authStore).
  - `src/types/`: TypeScript types.
  - `src/constants/`, `src/hooks/`, `src/locales/`, `src/middleware/`, `src/styles/`, `src/config/`: Supporting files.
- **Backend (`backend/`)**:
  - `src/app.ts`: Express app setup (CORS, middleware, routes).
  - `src/server.ts`: Starts server on port 8081.
  - `src/routes/`: index.ts (mounts all routers), system.routes.ts (health/API overview).
  - `src/modules/`: Feature modules (auth/, users/, students/, etc.), each with .routes.ts, .controller.ts, etc.
  - `src/models/`: Mongoose schemas (User.ts, Class.ts, etc.).
  - `src/middlewares/`: auth.ts (JWT/RBAC), rbac.ts (role checks), validate.ts (Joi), rateLimiter.ts, errorHandler.ts.
  - `src/services/`: Business logic (studentService.ts, userService.ts).
  - `src/config/`: env.ts (config vars).
  - `src/constants/`, `src/helpers/`, `src/types/`, `src/utils/`, `src/validators/`: Supporting files.
  - `src/scripts/`: Seed scripts (seed.ts, create_super_admin.js, etc.).

## Routes List

### Frontend Routes
- `/login` → LoginPage (public)
- `/home` → HomePage (public)
- `/forbidden` → ForbiddenPage (public)
- `/` → Redirect to /home (public)
- `/dashboard` → DashboardPage (all roles)
- `/dashboard/super-admin` → SuperAdminDashboard (super_admin)
- `/dashboard/manage-users` → ManageUsersPage (super_admin)
- `/dashboard/admin`, `/dashboard/teacher`, `/dashboard/student`, `/dashboard/family`, `/dashboard/accountant`, `/dashboard/librarian` → DashboardPage (role-specific)
- `/users` → UsersPage (super_admin)
- `/analytics` → AnalyticsPage (super_admin, admin)
- `/campaign` → CampaignPage (admin)
- `/ecommerce` → EcommercePage (super_admin, admin)
- `/settings` → SettingsPage (super_admin, admin, user)
- Dynamic: `/users`, `/students`, `/teachers`, `/classes`, `/subjects`, `/exams`, `/results`, `/families`, `/books`, `/expenses`, `/finance`, `/notifications`, `/audit`, `/roles`, `/permissions` → CrudPage (varies)
- `/profile` → ProfilePage (authenticated)
- `*` → NotFoundPage (public)

### Backend Routes
- POST `/api/auth/login` → auth (public)
- GET `/api/auth/profile` → auth (authenticated)
- GET/POST `/api/users` → users (super_admin, admin)
- GET `/api/users/count` → users (super_admin, admin)
- GET/PUT/DELETE `/api/users/:id` → users (super_admin)
- PUT `/api/users/:id/permissions` → users (super_admin)
- GET/POST `/api/students` → students (super_admin, admin)
- PUT `/api/students/:id` → students (super_admin, admin)
- GET `/api/students/family` → students (family_student)
- GET `/api/students/teacher` → students (teacher)
- GET/POST `/api/teachers` → teachers (super_admin, admin)
- GET `/api/teachers/payroll` → teachers (super_admin, admin)
- GET/PUT/DELETE `/api/teachers/:id` → teachers (super_admin, admin)
- GET/POST/PUT/DELETE `/api/classes` → classes (varies)
- GET/POST/PUT/DELETE `/api/subjects` → subjects (varies)
- GET/POST/PUT/DELETE `/api/exams` → exams (super_admin, admin, teacher)
- GET/POST/PUT/DELETE `/api/results` → results (varies)
- GET/POST/PUT/DELETE `/api/families` → families (varies)
- GET/POST/PUT/DELETE `/api/books` → books (super_admin, admin, librarian)
- GET/POST/PUT/DELETE `/api/expenses` → expenses (super_admin, admin, accountant)
- GET `/api/finance/summary` → finance (super_admin, admin, accountant)
- GET/POST/PUT/DELETE `/api/notifications` → notifications (varies)
- GET `/api/audit` → audit (super_admin, admin)
- GET `/api/roles` → roles (super_admin)
- GET `/api/permissions` → permissions (super_admin)
- GET `/api/dashboard/summary` → dashboard (all)
- POST `/api/admin/reset-data` → admin (super_admin)
- POST `/api/admin/seed-students` → admin (super_admin)
- POST `/api/admin/reset-all` → admin (super_admin)
- POST `/api/admin/rebuild-system` → admin (super_admin)
- GET `/health` → system (public)
- GET `/` → system (public)

## Frontend/Backend Separation
- Frontend: All in `frontend/` - UI, routing, state, API calls.
- Backend: All in `backend/` - API, business logic, database.
- Shared: Root files, uploads, account info.

## Modules Completion %
- Authentication: 100%
- User Management: 95%
- Teachers: 90%
- Students: 85%
- Classes: 80%
- Subjects: 75%
- Attendance: 0%
- Payments: 50%
- Reports: 60%
- Dashboard: 90%
- Settings: 70%
- Permissions: 95%
- Notifications: 80%

## Missing Features
- Attendance tracking system.
- Advanced payment management (invoices, student payment history).
- Comprehensive reports (performance analytics, financial summaries).
- Push/email notifications.
- Customizable dashboard widgets.
- User preferences in settings.
- Dynamic permission assignment UI.

## Recommendations
- Implement attendance module with CRUD and integration.
- Expand payments with dedicated routes and UI.
- Add advanced reporting features.
- Integrate real notification services.
- Add more dashboard customization.
- Enhance settings with user prefs.
- Refactor duplicated code in controllers.
- Add token blacklisting for security.
- Expand rate limiting beyond auth.