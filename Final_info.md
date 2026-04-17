# Final Info - Nokta Academy Management System

## پروژه Nokta Academy Management System

این سیستم یک برنامه کامل وب است که برای مدیریت آکادمی طراحی شده، شامل بخش‌های فرانت‌اند و بک‌اند با اتصال کامل به دیتابیس MongoDB.

## معماری کلی سیستم

### ساختار فول استک
- **فرانت‌اند**: React 18 با Vite، TypeScript، Tailwind CSS، Zustand برای مدیریت حالت، React Query برای داده‌های سرور، React Router برای مسیریابی، i18next برای بین‌المللی‌سازی، Framer Motion برای انیمیشن‌ها، Lucide React برای آیکون‌ها، و پشتیبانی PWA.
- **بک‌اند**: Node.js با Express.js، TypeScript، MongoDB با Mongoose ODM، JWT برای احراز هویت، bcryptjs برای هش رمز عبور، Joi برای اعتبارسنجی، Helmet برای هدرهای امنیتی، CORS برای درخواست‌های متقابل، و express-rate-limit برای محدودسازی نرخ.
- **اشتراک‌گذاری**: فایل‌های ریشه شامل README.md، account/، uploads/ برای تصاویر پروفایل.

### اتصال فرانت‌اند به بک‌اند
- فرانت‌اند از Axios برای ارتباط با API استفاده می‌کند، تنظیم شده در `frontend/src/services/api.ts` با URL پایه `http://localhost:8081/api`.
- پاسخ‌های API ساختار یکسانی دارند: `{ success: boolean, data: any, message: string, meta?: any }`.
- مدیریت خطا شامل خطاهای شبکه، پاسخ‌های 4xx/5xx، و حالت‌های بارگذاری.

### جریان API
- درخواست‌ها از کامپوننت‌های فرانت‌اند → Axios → مسیرهای بک‌اند → کنترلرها/سرویس‌ها → مدل‌های دیتابیس → پاسخ‌ها برگردانده می‌شوند.
- مثال: ورود از `frontend/src/features/auth/pages/LoginPage.tsx` فراخوانی `authService.login()` → POST `/api/auth/login` → `auth.routes.ts` → پرس‌وجوی مدل User → پاسخ توکن JWT → ذخیره در localStorage → هدایت به داشبورد.

### جریان احراز هویت
- ورود: کاربر ایمیل/رمز عبور ارسال می‌کند → بک‌اند اعتبارسنجی در برابر مدل User (bcrypt مقایسه) → تولید توکن‌های دسترسی/رفرش JWT → ذخیره در localStorage.
- پروفایل: در بارگذاری اپ، توکن‌ها بررسی می‌شوند → فراخوانی GET `/api/auth/profile` → تایید JWT → بازگشت داده‌های کاربر → تنظیم حالت Zustand auth.
- خروج: پاک کردن localStorage توکن‌ها → تنظیم مجدد حالت auth → هدایت به ورود.
- رفرش: استفاده از توکن رفرش برای دریافت توکن دسترسی جدید اگر منقضی شده.

### جریان RBAC
- نقش‌ها: super_admin, admin, teacher, student, family_student, accountant, librarian.
- مجوزها: تعریف شده در `backend/src/utils/roles.ts` و `frontend/src/features/resources/config/modules.ts`، بررسی شده توسط میان‌افزار `authorize()`.
- ACL: کنترل دسترسی اضافی در کنترلرها (مثل دانشجویان فقط داده‌های خود را ببینند از طریق `req.user.userId` فیلتر).
- مثال: دانشجو نتایج را می‌بیند → GET `/api/results` → `authorize(['student'])` عبور می‌کند → کنترلر فیلتر `filter.student = req.user.userId`.

### روابط دیتابیس
- **مدل User**: مدل مرکزی برای همه انواع کاربر (فیلد role تفاوت ایجاد می‌کند). روابط: teacherId (برای دانشجویان)، familyId (برای دانشجویان/family_students).
- **مدل Class**: آرایه subjects (ObjectIds)، آرایه assignedTeachers.
- **مدل Subject**: ارجاع به classId، teacher (ObjectId User).
- مدل‌های Exam/Result: Exam ارجاع به subject/class، Result ارجاع به student/exam.
- **مدل Family**: ارجاع به آرایه students (ObjectId User).
- روابط از populate Mongoose برای join استفاده می‌کنند (مثل GET دانشجویان populate classId/subjectId/teacherId).

## ساختار فولدرها

### فرانت‌اند (`frontend/`)
- `src/app/`: App.tsx (کامپوننت اصلی)، main.tsx (ورودی)، providers/ (تم و غیره).
- `src/components/`: کامپوننت‌های UI (Card, Button و غیره).
- `src/features/`: ماژول‌های ویژگی (auth/، dashboard/، resources/، users/).
- `src/layouts/`: AppShell، DashboardLayout.
- `src/pages/`: HomePage، NotFoundPage و غیره.
- `src/routes/`: AppRoutes.tsx (منطق مسیریابی).
- `src/services/`: سرویس API.
- `src/store/`: استورهای Zustand (authStore).
- `src/types/`: تایپ‌های TypeScript.
- `src/constants/`، `src/hooks/`، `src/locales/`، `src/middleware/`، `src/styles/`، `src/config/`: فایل‌های پشتیبانی.

### بک‌اند (`backend/`)
- `src/app.ts`: تنظیم Express (CORS، میان‌افزار، مسیرها).
- `src/server.ts`: راه‌اندازی سرور روی پورت 8081.
- `src/routes/`: index.ts (mount همه روترها)، system.routes.ts (سلامت/API overview).
- `src/modules/`: ماژول‌های ویژگی (auth/، users/، students/ و غیره)، هر کدام با .routes.ts، .controller.ts و غیره.
- `src/models/`: اسکیمای Mongoose (User.ts، Class.ts و غیره).
- `src/middlewares/`: auth.ts (JWT/RBAC)، rbac.ts (بررسی نقش‌ها)، validate.ts (Joi)، rateLimiter.ts، errorHandler.ts.
- `src/services/`: منطق کسب‌وکار (studentService.ts، userService.ts).
- `src/config/`: env.ts (متغیرهای پیکربندی).
- `src/constants/`، `src/helpers/`، `src/types/`، `src/utils/`، `src/validators/`: فایل‌های پشتیبانی.
- `src/scripts/`: اسکریپت‌های seed (seed.ts، create_super_admin.js و غیره).

## مسیرهای کامل (Routes)

### مسیرهای فرانت‌اند
- `/login` → LoginPage (عمومی)
- `/home` → HomePage (عمومی)
- `/forbidden` → ForbiddenPage (عمومی)
- `/` → Redirect به /home (عمومی)
- `/dashboard` → DashboardPage (همه نقش‌ها)
- `/dashboard/super-admin` → SuperAdminDashboard (super_admin)
- `/dashboard/manage-users` → ManageUsersPage (super_admin)
- `/dashboard/admin`, `/dashboard/teacher`, `/dashboard/student`, `/dashboard/family`, `/dashboard/accountant`, `/dashboard/librarian` → DashboardPage (نقش خاص)
- `/users` → UsersPage (super_admin)
- `/analytics` → AnalyticsPage (super_admin, admin)
- `/campaign` → CampaignPage (admin)
- `/ecommerce` → EcommercePage (super_admin, admin)
- `/settings` → SettingsPage (super_admin, admin, user)
- مسیرهای پویا: `/users`, `/students`, `/teachers`, `/classes`, `/subjects`, `/exams`, `/results`, `/families`, `/books`, `/expenses`, `/finance`, `/notifications`, `/audit`, `/roles`, `/permissions` → CrudPage (متغیر)
- `/profile` → ProfilePage (کاربران احراز هویت شده)

### مسیرهای بک‌اند
- POST `/api/auth/login` → auth (عمومی)
- GET `/api/auth/profile` → auth (احراز هویت شده)
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
- GET/POST/PUT/DELETE `/api/classes` → classes (متغیر)
- GET/POST/PUT/DELETE `/api/subjects` → subjects (همه لیست شده)
- GET/POST/PUT/DELETE `/api/exams` → exams (super_admin, admin, teacher)
- GET/POST/PUT/DELETE `/api/results` → results (متغیر)
- GET/POST/PUT/DELETE `/api/families` → families (متغیر)
- GET/POST/PUT/DELETE `/api/books` → books (super_admin, admin, librarian)
- GET/POST/PUT/DELETE `/api/expenses` → expenses (super_admin, admin, accountant)
- GET `/api/finance/summary` → finance (super_admin, admin, accountant)
- GET/POST/PUT/DELETE `/api/notifications` → notifications (متغیر)
- GET `/api/audit` → audit (super_admin, admin)
- GET `/api/roles` → roles (super_admin)
- GET `/api/permissions` → permissions (super_admin)
- GET `/api/dashboard/summary` → dashboard (همه)
- POST `/api/admin/reset-data`, `/api/admin/seed-students`, `/api/admin/reset-all`, `/api/admin/rebuild-system` → admin (super_admin)
- GET `/health`, GET `/` → system (عمومی)

## فایل‌های کلیدی و اتصالات

### اتصالات فرانت‌اند به بک‌اند
- `frontend/src/services/api.ts` → تنظیم Axios برای همه API calls.
- `frontend/src/features/auth/services/authService.ts` → توابع login, profile, logout.
- `frontend/src/features/resources/services/[module]Service.ts` → CRUD operations برای هر ماژول.
- `frontend/src/store/authStore.ts` → مدیریت حالت احراز هویت.
- `frontend/src/routes/AppRoutes.tsx` → تعریف مسیرها و محافظت‌ها.

### اتصالات بک‌اند به دیتابیس
- `backend/src/models/User.ts` → مدل اصلی کاربر با روابط.
- `backend/src/models/Class.ts` → مدل کلاس با subjects و teachers.
- `backend/src/models/Subject.ts` → مدل موضوع با class و teacher.
- `backend/src/models/Exam.ts` → مدل امتحان با subject و class.
- `backend/src/models/Result.ts` → مدل نتیجه با student و exam.
- `backend/src/models/Family.ts` → مدل خانواده با students.
- `backend/src/models/Notification.ts` → مدل اعلان‌ها.
- `backend/src/models/AuditLog.ts` → مدل لاگ‌های حسابرسی.
- `backend/src/models/Book.ts` → مدل کتاب‌ها.
- `backend/src/models/Expense.ts` → مدل هزینه‌ها.
- `backend/src/models/SalaryTransaction.ts` → مدل تراکنش‌های حقوق.

### کنترلرها و سرویس‌ها
- `backend/src/modules/auth/auth.controller.ts` → کنترلر احراز هویت.
- `backend/src/modules/users/users.controller.ts` → کنترلر کاربران.
- `backend/src/modules/students/students.controller.ts` → کنترلر دانشجویان با ACL.
- `backend/src/modules/teachers/teachers.controller.ts` → کنترلر معلمان با حقوق.
- `backend/src/modules/classes/classes.controller.ts` → کنترلر کلاس‌ها.
- `backend/src/modules/subjects/subjects.controller.ts` → کنترلر موضوعات.
- `backend/src/modules/exams/exams.controller.ts` → کنترلر امتحان‌ها.
- `backend/src/modules/results/results.controller.ts` → کنترلر نتایج.
- `backend/src/modules/families/families.controller.ts` → کنترلر خانواده‌ها.
- `backend/src/modules/books/books.controller.ts` → کنترلر کتاب‌ها.
- `backend/src/modules/expenses/expenses.controller.ts` → کنترلر هزینه‌ها.
- `backend/src/modules/finance/finance.controller.ts` → کنترلر مالی.
- `backend/src/modules/notifications/notifications.controller.ts` → کنترلر اعلان‌ها.
- `backend/src/modules/audit/audit.controller.ts` → کنترلر حسابرسی.
- `backend/src/modules/roles/roles.controller.ts` → کنترلر نقش‌ها.
- `backend/src/modules/permissions/permissions.controller.ts` → کنترلر مجوزها.
- `backend/src/modules/dashboard/dashboard.controller.ts` → کنترلر داشبورد.
- `backend/src/modules/admin/admin.controller.ts` → کنترلر ادمین.

### میان‌افزارها
- `backend/src/middlewares/auth.ts` → احراز هویت JWT و RBAC.
- `backend/src/middlewares/validate.ts` → اعتبارسنجی Joi.
- `backend/src/middlewares/errorHandler.ts` → مدیریت خطا.
- `backend/src/middlewares/rateLimiter.ts` → محدودسازی نرخ.
- `backend/src/middlewares/upload.ts` → آپلود فایل.

### سرویس‌ها
- `backend/src/services/studentService.ts` → منطق کسب‌وکار دانشجویان.
- `backend/src/services/userService.ts` → منطق کسب‌وکار کاربران.
- `backend/src/services/classService.ts` → منطق کسب‌وکار کلاس‌ها.
- `backend/src/services/fileUploadService.ts` → آپلود فایل.

## درصد تکمیل پروژه

### ماژول‌های تکمیل شده
- **احراز هویت (Authentication)**: 100% - جریان کامل JWT، ورود/خروج، پروفایل، توکن‌های رفرش، هش bcrypt، محدودسازی نرخ.
- **مدیریت کاربر (User Management)**: 95% - CRUD کاربران، تخصیص نقش، مدیریت مجوزها، نقطه پایانی شمارش. جستجوی پیشرفته/فیلترها گم شده.
- **معلمان (Teachers)**: 90% - CRUD، محاسبه حقوق (ثابت/درصدی)، نقطه پایانی حقوق، موضوعات/کلاس‌های تخصیص یافته. UI تخصیص‌های جزئی گم شده.
- **دانشجویان (Students)**: 85% - CRUD با ACL، ایجاد خودکار خانواده، تولید شماره رول، پیگیری هزینه. تاریخچه پرداخت یا ادغام حضور گم شده.
- **کلاس‌ها (Classes)**: 80% - CRUD، مدیریت کد موضوع/کلاس، تخصیص معلمان. برنامه‌ریزی یا اجرای ظرفیت گم شده.
- **موضوعات (Subjects)**: 75% - CRUD، روابط معلم/کلاس. پیوند امتحانات/نتایج خاص موضوع گم شده.
- **داشبورد (Dashboard)**: 90% - خلاصه‌های نقش‌محور، تحلیل‌ها، روندها. ویجت‌های قابل تنظیم گم شده.
- **مجوزها (Permissions)**: 95% - RBAC با قالب‌ها، لغو مجوزهای کاربر. UI تخصیص پویا گم شده.
- **اعلان‌ها (Notifications)**: 80% - CRUD اعلان‌ها، گیرندگان نقش‌محور. ادغام پوش/ایمیل گم شده.

### ماژول‌های معلق
- **حضور (Attendance)**: 0% - هیچ سیستم ردیابی پیاده‌سازی نشده.
- **پرداخت‌ها (Payments)**: 50% - هزینه‌های اساسی/مالی، هزینه‌های دانشجو در مدل. CRUD پرداخت اختصاصی، فاکتورها، تاریخچه پرداخت دانشجو گم شده.
- **گزارش‌ها (Reports)**: 60% - CRUD نتایج امتحان. گزارش‌های پیشرفته (تجزیه عملکرد، خلاصه‌های مالی) گم شده.
- **تنظیمات (Settings)**: 70% - صفحه تنظیمات اساسی. ترجیحات کاربر یا پیکربندی سیستم گم شده.

### درصد کلی تکمیل
**75%** - هسته احراز هویت، مدیریت کاربر، عملیات CRUD، و RBAC کامل پیاده‌سازی شده‌اند. شکاف‌های اصلی در حضور، پرداخت‌های پیشرفته، و ویژگی‌های گزارش‌دهی.

## خلاصه نهایی
پروژه Nokta Academy Management System دارای پایه محکمی با معماری فول استک است، اما برای آماده‌سازی تولید نیاز به تکمیل ماژول‌های حضور، پرداخت‌ها، و گزارش‌ها دارد. اتصالات فرانت‌اند به بک‌اند و دیتابیس کامل و کارآمد هستند، با جریان‌های امن احراز هویت و RBAC.
---

## 2026-04-16 Recovery Update

### Task 1 - Login Role Selector Dark Mode Fix
- date: 2026-04-16
- module fixed: Authentication login surface
- issue before: Login role selector relied on native select styling and had poor dark-mode contrast, weak focus state visibility, and inconsistent stacking behavior.
- root cause found: Native select styling was bypassing the shared themed select component, so dark/light contrast and dropdown z-index were not aligned with the rest of the design system.
- files modified: `frontend/src/features/auth/pages/LoginPage.tsx`, `frontend/src/components/ui/Select.tsx`
- backend/frontend logic changed: Frontend now uses the shared themed select with explicit light/dark styling, stronger focus states, and higher dropdown stacking context.
- tests executed: `npx tsc --noEmit` in `frontend`, `npm run build` in `frontend`
- final result: Role selector is readable in dark and light mode, visually layered correctly, and remains mobile-safe.

### Task 2 - Register Form Upgrade + Fix
- date: 2026-04-16
- module fixed: Public student registration
- issue before: Registration option loading was fragile, fee automation was missing, and class fee was not persisted at class creation time.
- root cause found: Frontend and backend contracts were incomplete. Class fee did not exist on the class model, registration option payloads did not expose pricing, and student registration stored zero fees regardless of selected class/subject.
- files modified: `backend/src/models/Class.ts`, `backend/src/services/classService.ts`, `backend/src/modules/classes/classes.routes.ts`, `backend/src/modules/auth/auth.routes.ts`, `frontend/src/features/auth/pages/RegisterPage.tsx`, `frontend/src/features/resources/config/modules.ts`
- backend/frontend logic changed: Added `feeAmount` to classes, exposed class/subject fees in registration options, added gender to public registration, enforced class/teacher gender rules, and auto-calculated class fee + subject fee + total fee during registration.
- tests executed: `npm run build` in `backend`, `npx tsc --noEmit` in `frontend`, `npm run build` in `frontend`
- final result: Registration now loads classes/subjects/teachers with loading/fallback states and shows live class fee, subject fee, and total fee.

### Task 3 - Branch Module Full Fix
- date: 2026-04-16
- module fixed: Branch management
- issue before: Branch management lacked safe manager assignment wiring and the frontend could not source manager options for owner-safe branch administration.
- root cause found: Branch list serialization did not expose manager details, and the frontend was pointing at `/users`, which is admin-only and not usable by owner branch workflows.
- files modified: `backend/src/modules/branches/branches.routes.ts`, `frontend/src/features/resources/config/modules.ts`
- backend/frontend logic changed: Added branch manager option endpoint, manager validation on create/update, enriched branch list responses with manager metadata, and wired the frontend manager selector to the branch-specific options endpoint.
- tests executed: `npm run build` in `backend`, `npx tsc --noEmit` in `frontend`
- final result: Branch list/create/update flows now support explicit branch manager assignment without depending on admin-only user listing.

### Task 4 - Attendance Module Audit Pass
- date: 2026-04-16
- module fixed: Attendance wiring audit
- issue before: Project notes claimed attendance was missing/404.
- root cause found: The attendance route, model, validation, RBAC, and role-scoped query logic already existed in the current modular backend; the gap was primarily stale project-state reporting rather than missing route mounting.
- files modified: No direct code change in this pass; audit confirmed `backend/src/modules/attendance/attendance.routes.ts` and the shared CRUD wiring remain intact.
- backend/frontend logic changed: Preserved existing attendance RBAC and role-scoped filtering.
- tests executed: `npm run build` in `backend`, `npx tsc --noEmit` in `frontend`
- final result: Attendance remains mounted at `/api/attendance` and available through the shared module route.

### Task 5 - Exams Table Data Fix
- date: 2026-04-16
- module fixed: Exams data serialization
- issue before: Exam rows could still render missing labels when legacy shapes or alternate populated fields were returned.
- root cause found: Exam serializer only trusted one populated structure and did not safely fall back to alternate teacher/subject fields.
- files modified: `backend/src/modules/exams/exams.routes.ts`
- backend/frontend logic changed: Serializer now safely resolves subject/class/teacher names from populated or legacy response shapes.
- tests executed: `npm run build` in `backend`
- final result: Exams table has stronger safe-label rendering and no longer depends on a single populated object shape.

### Task 6 - Results Table Data Fix
- date: 2026-04-16
- module fixed: Results population and mapping
- issue before: Result rows were missing teacher context and could lose populated exam metadata.
- root cause found: Result queries populated subject/class but not teacher metadata, and serializer did not expose teacher-safe output.
- files modified: `backend/src/modules/results/results.routes.ts`, `frontend/src/features/resources/config/modules.ts`
- backend/frontend logic changed: Result endpoints now populate exam teacher and gradedBy, and the frontend result grid includes teacher-safe rendering.
- tests executed: `npm run build` in `backend`, `npx tsc --noEmit` in `frontend`
- final result: Results table now carries student, class, subject, exam, and teacher context consistently.

### Task 7 - Payments Module Full Fix
- date: 2026-04-16
- module fixed: Payments and invoice handling
- issue before: Payments lacked enriched list data and invoice retrieval, which made the module feel incomplete and audit-light.
- root cause found: Payment responses returned raw documents without student-facing labels, invoice identifiers, or printable invoice payload data.
- files modified: `backend/src/modules/payments/payments.routes.ts`, `frontend/src/features/resources/config/modules.ts`
- backend/frontend logic changed: Added payment serializer, invoice number generation, student metadata enrichment, and `GET /api/payments/:id/invoice`.
- tests executed: `npm run build` in `backend`, `npx tsc --noEmit` in `frontend`
- final result: Payments now expose payment history with readable student context and invoice payloads while preserving immutable finance records.

### Task 8 - Finance Dashboard Complete
- date: 2026-04-16
- module fixed: Finance summary dashboard
- issue before: Finance page mainly surfaced total income while pending balance and salary payout trends were missing.
- root cause found: Backend summary endpoint did not aggregate pending-balance timeline or salary payout trend, and the frontend only rendered the original revenue widgets.
- files modified: `backend/src/modules/finance/finance.routes.ts`, `frontend/src/features/finance/services/financeService.ts`, `frontend/src/features/finance/pages/FinancePage.tsx`
- backend/frontend logic changed: Added `monthlyPendingBalances` and `salaryPayoutTrend` to finance summary and rendered dedicated charts on the finance page.
- tests executed: `npm run build` in `backend`, `npx tsc --noEmit` in `frontend`, `npm run build` in `frontend`
- final result: Finance dashboard now shows student payments, pending balances, teacher salary payments, monthly revenue, pending balance trend, and salary payout trend.

### Task 9 - Expenses Module Full Fix
- date: 2026-04-16
- module fixed: Expenses dashboard
- issue before: Expenses page did not visualize monthly trend even though backend summary already produced category and monthly data.
- root cause found: Frontend page only rendered category breakdown and recent expense cards, leaving monthly totals unused.
- files modified: `frontend/src/features/finance/pages/ExpensesPage.tsx`
- backend/frontend logic changed: Added monthly expense trend chart alongside expense category visualization.
- tests executed: `npx tsc --noEmit` in `frontend`, `npm run build` in `frontend`
- final result: Expenses page now shows KPI cards, monthly chart, category chart, and recent expense list.

### Task 10 - Reports Dashboard Complete
- date: 2026-04-16
- module fixed: Reports analytics dashboard
- issue before: Reports page did not show class, exam, result, or total income KPIs even though the user story requires real academic and finance metrics.
- root cause found: Backend analytics payload exposed only a smaller KPI set, and the frontend page mapped only those limited cards.
- files modified: `backend/src/modules/reports/reports.routes.ts`, `frontend/src/features/reports/services/reportsService.ts`, `frontend/src/features/reports/pages/ReportsPage.tsx`
- backend/frontend logic changed: Added total classes, exams, results, and total income to the reports analytics contract and rendered them in the reports dashboard.
- tests executed: `npm run build` in `backend`, `npx tsc --noEmit` in `frontend`, `npm run build` in `frontend`
- final result: Reports dashboard now surfaces broader real metrics for student/teacher/class/exam/result/finance overview cards and keeps the existing charts.

### Task 11 - Audit Report Fix
- date: 2026-04-16
- module fixed: Audit reporting
- issue before: Audit rows could miss `type` and `severity`, and owner access was inconsistent with read-only governance analytics expectations.
- root cause found: Audit serializer returned raw logs without type derivation fallback, and owner role was excluded from the audit route guard.
- files modified: `backend/src/modules/audit/audit.routes.ts`, `frontend/src/features/resources/config/modules.ts`
- backend/frontend logic changed: Added type derivation from audit action prefixes, defaulted severity to `info`, and allowed owner access to audit reports.
- tests executed: `npm run build` in `backend`, `npx tsc --noEmit` in `frontend`
- final result: Audit reporting now renders stable type/severity values and aligns better with read-only governance access.

### Task 12 - Roles Sidebar Module Fix
- date: 2026-04-16
- module fixed: Roles page and sidebar visibility
- issue before: Roles page was too thin to be operationally useful and owner navigation did not expose it despite backend access support.
- root cause found: Frontend only fetched role list data and ignored permission templates; owner sidebar menu omitted the roles entry.
- files modified: `frontend/src/features/roles/services/rolesService.ts`, `frontend/src/features/roles/pages/RolesPage.tsx`, `frontend/src/features/resources/config/modules.ts`
- backend/frontend logic changed: Added permission template consumption from `/api/permissions/template`, improved roles page loading/summary UI, and exposed roles in owner navigation.
- tests executed: `npx tsc --noEmit` in `frontend`, `npm run build` in `frontend`
- final result: Roles module is now reachable from supported navigation and provides a safer RBAC reference view with permission templates.

### Task 13 - New Super Admin Master Dashboard
- date: 2026-04-16
- module fixed: Additional super admin dashboard
- issue before: There was no dedicated master overview that linked every core module from a single equal-card dashboard.
- root cause found: Existing dashboard summary endpoint and super admin page did not expose a module-count control center.
- files modified: `backend/src/modules/dashboard/dashboard.routes.ts`, `frontend/src/features/dashboard/services/dashboardService.ts`, `frontend/src/features/dashboard/pages/SuperAdminDashboard.tsx`, `frontend/src/features/dashboard/pages/SuperAdminMasterDashboard.tsx`, `frontend/src/routes/AppRoutes.tsx`
- backend/frontend logic changed: Added `GET /api/dashboard/master-summary`, created a new master dashboard page, and linked it from the existing super admin dashboard without removing the current page.
- tests executed: `npm run build` in `backend`, `npx tsc --noEmit` in `frontend`, `npm run build` in `frontend`
- final result: Super admin now has an additional master dashboard with equal-height module cards, direct module links, glass styling, and entrance animation.

### Task 14 - Full RTL Support
- date: 2026-04-16
- module fixed: Shared RTL/LTR behavior
- issue before: Document direction switched correctly, but shared form/table/modal alignment still depended too much on page-level classes.
- root cause found: Base RTL/LTR styles were minimal and did not explicitly normalize inputs, tables, modal header flow, or modal action placement.
- files modified: `frontend/src/styles/rtl/index.css`, `frontend/src/styles/ltr/index.css`, `frontend/src/shared/components/Common.tsx`
- backend/frontend logic changed: Added explicit RTL/LTR alignment rules for form controls and tables and made modal/search shared components direction-aware.
- tests executed: `npx tsc --noEmit` in `frontend`, `npm run build` in `frontend`
- final result: Shared table, input, select, and modal interactions now follow document direction more consistently for Dari/Pashto versus English.

### Task 15 - Button UX Hover Improvement
- date: 2026-04-16
- module fixed: Cancel/close/logout action affordances
- issue before: High-risk exit actions visually blended into neutral UI patterns.
- root cause found: Shared button treatment and key close/logout actions were not using distinct destructive hover affordances.
- files modified: `frontend/src/components/ui/Button.tsx`, `frontend/src/shared/components/Common.tsx`, `frontend/src/features/dashboard/components/Navbar.tsx`, `frontend/src/layouts/AppShell.tsx`
- backend/frontend logic changed: Added stronger focus ring handling and red animated hover treatments for cancel, close, and logout actions.
- tests executed: `npx tsc --noEmit` in `frontend`, `npm run build` in `frontend`
- final result: Exit-oriented actions now visually communicate risk through red hover state, scale, and shadow.

### Task 16 - Responsive System Optimization
- date: 2026-04-16
- module fixed: Auth, finance, expenses, reports, modal, and dashboard responsiveness
- issue before: Several pages were visually dense or uneven on smaller breakpoints.
- root cause found: Some pages used one-off layouts without equal-card or multi-breakpoint chart handling.
- files modified: `frontend/src/features/auth/pages/LoginPage.tsx`, `frontend/src/features/auth/pages/RegisterPage.tsx`, `frontend/src/features/finance/pages/FinancePage.tsx`, `frontend/src/features/finance/pages/ExpensesPage.tsx`, `frontend/src/features/reports/pages/ReportsPage.tsx`, `frontend/src/features/dashboard/pages/SuperAdminMasterDashboard.tsx`, `frontend/src/shared/components/Common.tsx`
- backend/frontend logic changed: Rebalanced grids, chart sections, and shared modal/action layouts for desktop/tablet/mobile behavior.
- tests executed: `npx tsc --noEmit` in `frontend`, `npm run build` in `frontend`
- final result: Updated pages now adapt more cleanly across desktop, tablet, and mobile layouts.

### Task 17 - Testing and QA
- date: 2026-04-16
- module fixed: Verification pass
- issue before: No fresh verification existed for the recovery changes made in this pass.
- root cause found: Large multi-module changes needed consolidated build and smoke validation.
- files modified: `backend/src/scripts/validate_api_integrity.ts` was reused as-is; no test source edits in this step.
- backend/frontend logic changed: None; verification only.
- tests executed:
  - `npm run build` in `backend` - passed
  - `npx tsc --noEmit` in `frontend` - passed
  - `npm run build` in `frontend` - passed
  - backend smoke health check via `GET /health` after local dev start - passed
  - `ENABLE_JOBS=false npm run validate-api` - executed successfully, but reported no seeded `super_admin` or `student` records available for protected endpoint/RBAC validation in the current local database
- final result: Code compiles cleanly and the backend health endpoint responds locally; authenticated smoke validation is currently limited by missing seeded test accounts in the active database.

### Deployment Notes
- Added a new class-level `feeAmount` field. Existing class records default safely to `0`, but administrators should populate class fees to enable full registration fee automation.
- Added `GET /api/branches/manager-options`, `GET /api/payments/:id/invoice`, and `GET /api/dashboard/master-summary`.
- Finance and reports frontends now expect the enriched summary payloads added in this recovery pass.

### Task 4 - Attendance Module Operational Completion
- date: 2026-04-16
- module fixed: Attendance operations, summary, and role-scoped UI
- issue before: Attendance had base CRUD wiring but was still short of a production workflow because filters were being stripped by validation, teachers were not fully constrained during write operations, and the frontend did not provide a dedicated role-aware attendance workspace.
- root cause found: The route used a pagination-only validator that dropped attendance-specific query parameters, the POST flow did not fully enforce teacher ownership on manual marking, and the frontend still relied on the generic CRUD surface instead of an attendance-specific summary/filter/mark flow.
- files modified: `backend/src/modules/attendance/attendance.routes.ts`, `backend/src/config/systemMasterRules.ts`, `frontend/src/features/attendance/services/attendanceService.ts`, `frontend/src/features/attendance/pages/AttendancePage.tsx`, `frontend/src/routes/AppRoutes.tsx`
- backend/frontend logic changed: Added attendance summary and scoped options endpoints, expanded query filtering, enforced teacher/branch-safe attendance writes, returned serialized attendance responses, added a dedicated attendance page with KPI cards, charts, filters, and manual attendance recording modal, and routed `/attendance` through the custom page instead of the generic CRUD shell.
- tests executed: `npm run build` in `backend`, `npx tsc --noEmit` in `frontend`, `npm run build` in `frontend`, `ENABLE_JOBS=false npm run validate-api` in `backend`
- final result: Attendance now behaves as a real operational module with teacher manual attendance flow, student/parent role-scoped visibility, admin oversight summary, and future-ready online attendance support hooks.

### Task 12 - Roles Governance Module Completion
- date: 2026-04-16
- module fixed: Roles management and RBAC governance controls
- issue before: Roles remained effectively read-only from the UI and lacked safe create/update/delete workflows for managed role profiles, which meant the module was still too thin for actual governance operations.
- root cause found: Backend routes only exposed a synthesized list view, route-policy enforcement did not distinguish role viewing from role management methods, and the frontend had no mutation UI for controlled role profile creation, editing, or reset.
- files modified: `backend/src/modules/roles/roles.routes.ts`, `backend/src/services/roleProfileService.ts`, `backend/src/middlewares/auth.ts`, `backend/src/middlewares/permission.ts`, `backend/src/services/permissionService.ts`, `backend/src/utils/roleHelpers.ts`, `backend/src/types/index.d.ts`, `backend/src/config/systemMasterRules.ts`, `frontend/src/features/roles/services/rolesService.ts`, `frontend/src/features/roles/pages/RolesPage.tsx`
- backend/frontend logic changed: Added controlled role profile create/update/delete endpoints for canonical enterprise roles, introduced role-permission override resolution for managed RBAC profiles, separated `ROLE_VIEW` from `ROLE_MANAGE` route enforcement, and upgraded the roles page into a management UI with profile editing, permission template selection, and reset-to-default behavior.
- tests executed: `npm run build` in `backend`, `npx tsc --noEmit` in `frontend`, `npm run build` in `frontend`, `ENABLE_JOBS=false npm run validate-api` in `backend`
- final result: Roles module now supports governance-safe role profile CRUD, permission template management, and runtime permission resolution for managed role overrides without destructive refactors of the existing enterprise role foundation.

### Task 17 - QA Addendum
- date: 2026-04-16
- module fixed: Post-attendance and post-roles verification pass
- issue before: The new attendance and roles governance changes needed a fresh compile and integrity check after backend and frontend route changes.
- root cause found: New service/page wiring and RBAC policy updates introduced new type and route-contract surfaces that required end-to-end compile verification.
- files modified: No additional production files beyond the task fixes above; this entry records verification for the final pass.
- backend/frontend logic changed: None in this documentation-only step.
- tests executed:
  - `npm run build` in `backend` - passed
  - `npx tsc --noEmit` in `frontend` - passed
  - `npm run build` in `frontend` - passed
  - `ENABLE_JOBS=false npm run validate-api` in `backend` - executed successfully, but current database still lacks seeded `super_admin` and `student` accounts for protected endpoint and RBAC denial smoke checks
- final result: The attendance and roles completion pass compiles cleanly and the remaining QA limitation is now isolated to missing seeded verification accounts in the active local database.
