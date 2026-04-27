# Nokta Academy Management System

A modern full-stack school management system built with React, Vite, Tailwind CSS, Node.js, Express, and MongoDB.

## Features Implemented

### Core Features
- **User Management**: Super Admin, Admins, Teachers, Students, Family Students, Librarians, Accountants
- **Authentication & Authorization**: JWT-based auth with RBAC (Role-Based Access Control) and ACL (Access Control List)
- **Dashboard**: Role-based dashboards with analytics and user visibility controls

### Advanced Features
- **Dynamic Teacher Salary**: Fixed or percentage-based salary calculation
- **Student Data Restrictions**: Students can only view their own data via ACL
- **Auto Family Account Creation**: Automatic creation of family accounts for students
- **Admin Dashboard User Visibility**: Admins can see all users, others have restricted access
- **Secure Login**: Robust authentication with password hashing and error handling

### Technical Features
- **Backend**: Express.js with TypeScript, MongoDB with Mongoose, modular architecture
- **Frontend**: React with Vite, Tailwind CSS, Zustand for state management
- **Security**: Helmet, CORS, rate limiting, input validation with Joi
- **Database Seeding**: Automated data population with sample users and data

## Folder Structure

- `backend/` — Express API with modular controllers, authorization, validation, and dashboard summary endpoints.
- `frontend/` — Vite React app with lazy routes, React Query, Zustand, optimized UI, and PWA support.
- `account/` — System accounts and credentials file.

## Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (running on localhost:27017)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env if needed (default MongoDB URI: mongodb://localhost:27017/nokta_academy)
npm run seed  # Populate database with sample data
npm run dev   # Start development server on port 8081
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev  # Start development server on port 5173
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Protected Routes (require authentication)
- `/api/users` - User management
- `/api/students` - Student operations with ACL
- `/api/teachers` - Teacher management with salary calculations
- `/api/classes` - Class management with ACL
- `/api/results` - Exam results with ACL and populate
- `/api/families` - Family management with ACL
- `/api/dashboard` - Dashboard analytics

## User Roles & Permissions

- **super_admin**: Full access to all features
- **admin**: Can manage users, view all data
- **teacher**: Can view/manage assigned students, exams, results
- **student**: Can only view own data
- **family_student**: Can view family members' data
- **librarian**: Library management
- **accountant**: Finance management

## Database Models

- **User**: Extended with salaryType, salaryValue, fee, familyId, teacherId
- **Family**: Family accounts
- **Class, Subject, Exam, Result**: Academic data
- **Expense, Book, Notification, AuditLog**: Additional features

## Development Notes

- Backend routes are protected via JWT and RBAC.
- Dashboard summary endpoint is exposed at `/api/dashboard/summary`.
- Frontend is designed for high performance with lazy imports, memoized components, and reusable UI.
- ACL implemented in controllers with type assertions for lean queries.
- Salary calculation supports fixed amount or percentage of student fees.

## Troubleshooting

- **Port Conflicts**: Backend runs on 8081, frontend on 5173
- **MongoDB Connection**: Ensure MongoDB is running on localhost:27017
- **Login Issues**: Check console logs for debug information
- **ACL Errors**: Ensure user roles are properly set in database

## Sample Accounts

See `account/accounts.md` for login credentials for all user types.
Quick login for the current project:
- Super Admin: `admin@gmail.com` / `12345678`
- Admin: `admin1@nokta.com` / `Admin123!`
- Teacher: `teacher1@nokta.com` / `Teacher123!`
- Student: `student1@nokta.com` / `Student123!`
- Parent/Family: `family1@nokta.com` / `Family123!`
# nokta_upd_Ai_and_finance
