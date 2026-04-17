# Nokta Academy Repair Report

Date: 2026-04-16

## What Was Broken

- Profile images were normalized inconsistently and the frontend fallback pointed to `/default-avatar.svg`, which was not aligned with the actual image assets in `frontend/public/images`.
- Finance and expenses were mixed together through the `Expense` collection, so the finance view could show expense-style data and vice versa.
- The roles screen was effectively empty because the backend returned only raw role strings instead of RBAC metadata.
- The permissions template endpoint returned a per-permission flat shape that did not match the frontend permission editor’s grouped module/action expectations.
- Reports used a generic CRUD rendering path instead of an analytics dashboard and had no endpoint for the required card/chart data contract.
- Dashboard financial aggregates still depended on legacy income-in-expense logic instead of separated finance queries.

## What Was Fixed

### Frontend

- Added centralized avatar resolution in `frontend/src/utils/profileImage.ts`.
- Implemented role-based profile image fallbacks using the existing files under `frontend/public/images`.
- Updated student, teacher, user, header, and profile rendering to use uploaded images first, then role defaults, then safe image-error fallback.
- Added dedicated pages for:
  - `FinancePage`
  - `ExpensesPage`
  - `ReportsPage`
  - `RolesPage`
- Updated route handling so these modules no longer depend on the generic CRUD renderer.

### Backend

- Added `FinanceEntry` model to separate manual income records from expenses.
- Reworked `/api/finance` to use payment/manual-income data instead of the expense ledger.
- Reworked `/api/expenses` to reject `income` records and added an expense summary endpoint.
- Expanded `/api/roles` to return:
  - role identity
  - permission list
  - permission count
  - user count
  - branch access summary
- Fixed `/api/permissions/template` to return grouped module/action templates that match the frontend permission editor.
- Added `/api/permissions` list support for RBAC inspection.
- Added `/api/reports/analytics` for the redesigned reports dashboard.
- Updated `/api/dashboard/summary` to use separated finance queries and include `totalBranches`.

## Route Issues Fixed

- `/api/finance`
- `/api/finance/summary`
- `/api/finance/income`
- `/api/expenses`
- `/api/expenses/summary`
- `/api/roles`
- `/api/permissions`
- `/api/permissions/template`
- `/api/reports/analytics`
- `/api/dashboard/summary`

## Remaining Risks

- Existing historical `Expense` documents with `category: "income"` still exist in old data; they are now excluded from the expense module, but a data migration would be cleaner.
- The fallback images rely on current nested asset paths like `/images/stunet/...` and `/images/techer/...`; renaming those folders later would require updating the role map.
- The finance dashboard now separates data sources logically, but a future dedicated `salary-payments` transaction module would make payroll history more explicit.

## Recommended Improvements

- Add a one-time migration to move legacy income rows from `expenses` into `finance_entries`.
- Add API integration smoke tests for:
  - roles
  - permissions template
  - finance summary
  - expenses summary
  - reports analytics
- Add localized labels for the new finance/expense/report widgets so the custom pages are fully translated.
- Add upload-aware avatar rendering to any remaining account detail views created after this repair.

## Verification

- Backend build: `npm run build` in `backend` passed.
- Frontend type-check: `npm exec tsc -- --noEmit` in `frontend` passed.
- Frontend production build: `npm run build` in `frontend` passed.
