# Route Map - Nokta Academy Management System

## Frontend Pages

### Public Routes
- **Path**: `/login`
  - **Component**: LoginPage (`frontend/src/features/auth/pages/LoginPage.tsx`)
  - **Layout**: None
  - **Protection**: None
  - **Permissions**: Public
  - **Connected Components**: Login form, error messages

- **Path**: `/home`
  - **Component**: HomePage (`frontend/src/pages/HomePage.tsx`)
  - **Layout**: None
  - **Protection**: None
  - **Permissions**: Public
  - **Connected Components**: Hero section, features

- **Path**: `/forbidden`
  - **Component**: ForbiddenPage (`frontend/src/pages/ForbiddenPage.tsx`)
  - **Layout**: None
  - **Protection**: None
  - **Permissions**: Public
  - **Connected Components**: Error message

- **Path**: `/`
  - **Component**: Redirect
  - **Layout**: None
  - **Protection**: None
  - **Permissions**: Public
  - **Connected Components**: None

- **Path**: `*`
  - **Component**: NotFoundPage (`frontend/src/pages/NotFoundPage.tsx`)
  - **Layout**: AppShell
  - **Protection**: None
  - **Permissions**: Public
  - **Connected Components**: 404 message

### Protected Routes
- **Path**: `/dashboard`
  - **Component**: DashboardPage (`frontend/src/features/dashboard/pages/DashboardPage.tsx`)
  - **Layout**: DashboardLayout
  - **Protection**: ProtectedRoute
  - **Permissions**: All roles
  - **Connected Components**: Charts, stats, role-based content

- **Path**: `/dashboard/super-admin`
  - **Component**: SuperAdminDashboard (`frontend/src/features/dashboard/pages/SuperAdminDashboard.tsx`)
  - **Layout**: DashboardLayout
  - **Protection**: ProtectedRoute
  - **Permissions**: super_admin
  - **Connected Components**: System overview, user management links

- **Path**: `/dashboard/manage-users`
  - **Component**: ManageUsersPage (`frontend/src/features/dashboard/pages/ManageUsersPage.tsx`)
  - **Layout**: DashboardLayout
  - **Protection**: ProtectedRoute
  - **Permissions**: super_admin
  - **Connected Components**: User list, edit forms

- **Path**: `/dashboard/admin`, `/dashboard/teacher`, `/dashboard/student`, `/dashboard/family`, `/dashboard/accountant`, `/dashboard/librarian`
  - **Component**: DashboardPage
  - **Layout**: DashboardLayout
  - **Protection**: ProtectedRoute
  - **Permissions**: Role-specific
  - **Connected Components**: Role-specific stats

- **Path**: `/users`
  - **Component**: UsersPage (`frontend/src/features/dashboard/pages/UsersPage.tsx`)
  - **Layout**: DashboardLayout
  - **Protection**: ProtectedRoute
  - **Permissions**: super_admin
  - **Connected Components**: User CRUD table

- **Path**: `/analytics`
  - **Component**: AnalyticsPage (`frontend/src/features/dashboard/pages/AnalyticsPage.tsx`)
  - **Layout**: DashboardLayout
  - **Protection**: ProtectedRoute
  - **Permissions**: super_admin, admin
  - **Connected Components**: Charts, analytics data

- **Path**: `/campaign`
  - **Component**: CampaignPage (`frontend/src/features/dashboard/pages/CampaignPage.tsx`)
  - **Layout**: DashboardLayout
  - **Protection**: ProtectedRoute
  - **Permissions**: admin
  - **Connected Components**: Campaign management

- **Path**: `/ecommerce`
  - **Component**: EcommercePage (`frontend/src/features/dashboard/pages/EcommercePage.tsx`)
  - **Layout**: DashboardLayout
  - **Protection**: ProtectedRoute
  - **Permissions**: super_admin, admin
  - **Connected Components**: Ecommerce features

- **Path**: `/settings`
  - **Component**: SettingsPage (`frontend/src/features/dashboard/pages/SettingsPage.tsx`)
  - **Layout**: DashboardLayout
  - **Protection**: ProtectedRoute
  - **Permissions**: super_admin, admin, user
  - **Connected Components**: Settings forms

- **Dynamic Paths**: `/users`, `/students`, `/teachers`, `/classes`, `/subjects`, `/exams`, `/results`, `/families`, `/books`, `/expenses`, `/finance`, `/notifications`, `/audit`, `/roles`, `/permissions`
  - **Component**: CrudPage (`frontend/src/features/resources/pages/CrudPage.tsx`)
  - **Layout**: AppShell
  - **Protection**: ProtectedRoute with config.permissions.view
  - **Permissions**: Varies (e.g., students: super_admin, admin)
  - **Connected Components**: DataTable, CreateForm, EditForm, DeleteModal

- **Path**: `/profile`
  - **Component**: ProfilePage (`frontend/src/pages/ProfilePage.tsx`)
  - **Layout**: AppShell
  - **Protection**: ProtectedRoute
  - **Permissions**: Authenticated users
  - **Connected Components**: Profile form, avatar upload

## Backend APIs

### Auth APIs
- **URL**: POST `/api/auth/login`
  - **Controller**: Inline in `auth.routes.ts`
  - **Middleware**: authLimiter, validate(authSchema)
  - **Auth Required**: No
  - **Role Permissions**: Public
  - **Connected Components**: LoginPage

- **URL**: GET `/api/auth/profile`
  - **Controller**: Inline in `auth.routes.ts`
  - **Middleware**: authenticate
  - **Auth Required**: JWT
  - **Role Permissions**: Authenticated
  - **Connected Components**: ProfilePage, auth store

### User Management APIs
- **URL**: GET/POST `/api/users`
  - **Controller**: users.routes.ts
  - **Middleware**: authenticate, authorize(['super_admin', 'admin']), validate
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin, admin
  - **Connected Components**: UsersPage, CrudPage

- **URL**: GET `/api/users/count`
  - **Controller**: users.routes.ts
  - **Middleware**: authenticate, authorize(['super_admin', 'admin'])
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin, admin
  - **Connected Components**: DashboardPage

- **URL**: GET/PUT/DELETE `/api/users/:id`
  - **Controller**: users.routes.ts
  - **Middleware**: authenticate, authorize(['super_admin']), validate
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin
  - **Connected Components**: CrudPage

- **URL**: PUT `/api/users/:id/permissions`
  - **Controller**: users.routes.ts
  - **Middleware**: authenticate, authorize(['super_admin']), validate
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin
  - **Connected Components**: CrudPage

### Student APIs
- **URL**: GET/POST `/api/students`
  - **Controller**: students.routes.ts
  - **Middleware**: authenticate, requireAdmin, validate
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin, admin
  - **Connected Components**: CrudPage

- **URL**: PUT `/api/students/:id`
  - **Controller**: students.routes.ts
  - **Middleware**: authenticate, requireAdmin, validate
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin, admin
  - **Connected Components**: CrudPage

- **URL**: GET `/api/students/family`
  - **Controller**: students.routes.ts
  - **Middleware**: authenticate, requireFamily
  - **Auth Required**: JWT
  - **Role Permissions**: family_student
  - **Connected Components**: CrudPage

- **URL**: GET `/api/students/teacher`
  - **Controller**: students.routes.ts
  - **Middleware**: authenticate, requireTeacher
  - **Auth Required**: JWT
  - **Role Permissions**: teacher
  - **Connected Components**: CrudPage

### Teacher APIs
- **URL**: GET/POST `/api/teachers`
  - **Controller**: teachers.routes.ts
  - **Middleware**: authenticate, requireAdmin, validate
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin, admin
  - **Connected Components**: CrudPage

- **URL**: GET `/api/teachers/payroll`
  - **Controller**: teachers.routes.ts
  - **Middleware**: authenticate, requireAdmin
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin, admin
  - **Connected Components**: CrudPage

- **URL**: GET/PUT/DELETE `/api/teachers/:id`
  - **Controller**: teachers.routes.ts
  - **Middleware**: authenticate, requireAdmin
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin, admin
  - **Connected Components**: CrudPage

### Class/Subject APIs
- **URL**: GET/POST/PUT/DELETE `/api/classes`
  - **Controller**: classes.routes.ts
  - **Middleware**: authenticate, authorize(varies), validate
  - **Auth Required**: JWT
  - **Role Permissions**: Varies
  - **Connected Components**: CrudPage

- **URL**: GET/POST/PUT/DELETE `/api/subjects`
  - **Controller**: subjects.routes.ts
  - **Middleware**: authenticate, authorize(varies), validate
  - **Auth Required**: JWT
  - **Role Permissions**: All listed
  - **Connected Components**: CrudPage

### Exam/Result APIs
- **URL**: GET/POST/PUT/DELETE `/api/exams`
  - **Controller**: exams.routes.ts
  - **Middleware**: authenticate, authorize(['super_admin', 'admin', 'teacher']), validate
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin, admin, teacher
  - **Connected Components**: CrudPage

- **URL**: GET/POST/PUT/DELETE `/api/results`
  - **Controller**: results.routes.ts
  - **Middleware**: authenticate, authorize(varies), validate
  - **Auth Required**: JWT
  - **Role Permissions**: Varies
  - **Connected Components**: CrudPage

### Other APIs
- **URL**: GET/POST/PUT/DELETE `/api/families`
  - **Controller**: families.routes.ts
  - **Middleware**: authenticate, authorize(varies), validate
  - **Auth Required**: JWT
  - **Role Permissions**: Varies
  - **Connected Components**: CrudPage

- **URL**: GET/POST/PUT/DELETE `/api/books`
  - **Controller**: books.routes.ts
  - **Middleware**: authenticate, authorize(['super_admin', 'admin', 'librarian']), validate
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin, admin, librarian
  - **Connected Components**: CrudPage

- **URL**: GET/POST/PUT/DELETE `/api/expenses`
  - **Controller**: expenses.routes.ts
  - **Middleware**: authenticate, authorize(['super_admin', 'admin', 'accountant']), validate
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin, admin, accountant
  - **Connected Components**: CrudPage

- **URL**: GET `/api/finance/summary`
  - **Controller**: finance.routes.ts
  - **Middleware**: authenticate, authorize(['super_admin', 'admin', 'accountant'])
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin, admin, accountant
  - **Connected Components**: DashboardPage

- **URL**: GET/POST/PUT/DELETE `/api/notifications`
  - **Controller**: notifications.routes.ts
  - **Middleware**: authenticate, authorize(varies), validate
  - **Auth Required**: JWT
  - **Role Permissions**: Varies
  - **Connected Components**: CrudPage

- **URL**: GET `/api/audit`
  - **Controller**: audit.routes.ts
  - **Middleware**: authenticate, authorize(['super_admin', 'admin']), validate
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin, admin
  - **Connected Components**: CrudPage

- **URL**: GET `/api/roles`
  - **Controller**: roles.routes.ts
  - **Middleware**: authenticate, authorize(['super_admin'])
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin
  - **Connected Components**: CrudPage

- **URL**: GET `/api/permissions`
  - **Controller**: permissions.routes.ts
  - **Middleware**: authenticate, authorize(['super_admin'])
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin
  - **Connected Components**: CrudPage

- **URL**: GET `/api/dashboard/summary`
  - **Controller**: dashboard.routes.ts
  - **Middleware**: authenticate, authorize(all)
  - **Auth Required**: JWT
  - **Role Permissions**: All
  - **Connected Components**: DashboardPage

- **URL**: POST `/api/admin/reset-data`, `/api/admin/seed-students`, `/api/admin/reset-all`, `/api/admin/rebuild-system`
  - **Controller**: admin.routes.ts
  - **Middleware**: authenticate, authorize(['super_admin'])
  - **Auth Required**: JWT
  - **Role Permissions**: super_admin
  - **Connected Components**: Admin UI

- **URL**: GET `/health`, GET `/`
  - **Controller**: system.routes.ts
  - **Middleware**: None
  - **Auth Required**: No
  - **Role Permissions**: Public
  - **Connected Components**: Health checks