# Project Management Tool — PRD

## Original Problem Statement
User wants a simple project-management tool with two experiences:
1. Admin view with dashboard/reporting.
2. Member/Manager view that behaves like a Google Sheet (junior employees are spreadsheet-familiar).

Uploaded screen recording used as visual/workflow reference only (sidebar/dashboard hierarchy), not a spec to copy wholesale.

## Roles
- **Admin**: sees all rows, full edit, delete rows, (future) dashboard/reporting.
- **Manager**: sees all rows, full edit (assign creator/reviewer, all statuses), cannot delete.
- **Member**: sees only own rows (creator = self), can edit work_date/version/time_taken/remarks/status (status limited to Not Started/Ongoing/Ready for Review), cannot edit deliverable_name/type/category/creator/reviewer, cannot delete.

## Data Model Decisions (user-approved)
- One row = one work activity (flat sheet, no parent-deliverable grouping in v1 — deferred).
- No real login for v1 — role switcher (acting-as demo user) simulates auth via `X-User-Id` header. Real auth deferred.
- Historical data import deferred — sheet built with empty/sample data first.
- Canonical `work_date`; `month` derived automatically (YYYY-MM), never free text.
- `version` stored separately from `deliverable_type`.

## What's Been Implemented (Sept 1, 2026)
- **Backend** (`/app/backend/server.py`): FastAPI + Mongo, UUID-based ids (no raw ObjectId exposure).
  - `GET/POST /api/users`, `GET /api/config/options` (dropdown lists), full CRUD on `/api/work-items` with role-based permission enforcement via `X-User-Id` header.
  - Seeded demo users on startup: admin-1 (Aisha Khan), manager-1 (Rahul Verma), manager-2 (Priya Nair), member-1 (Sam Fernandes), member-2 (Neha Joshi), member-3 (Vikram Singh).
- **Frontend**: Work Sheet screen only (`/app/frontend/src/pages/WorkSheetPage.jsx`).
  - Role switcher (top-right), spreadsheet-style table with inline-editable cells, toolbar (search + status/type/category/month filters + Add Row), delete restricted to admin.
  - Custom teal/slate theme (index.css) replacing default AI-slop palette.
  - All interactive elements have `data-testid` (see `constants/testIds/worksheet.js`).
- Tested via testing_agent: 20/20 backend pytest (`/app/backend/tests/test_worksheet.py`) + full frontend flow verification. All permission rules confirmed working.

## What's Been Implemented (Sept 1, 2026, part 2)
- **Admin Dashboard** (`/dashboard`, admin-only, styled per user's reference screen recording): sidebar layout (`Sidebar.jsx`, `AppLayout.jsx`), metric cards (total items, active members, hours logged, needs attention), 5-status breakdown tiles, Team Workload table, Needs Attention panel (oldest Ready-for-Review/Changes-Requested first). Non-admins see an inline "admins only" notice.
- **Bulk actions on Work Sheet**: row checkboxes + select-all, `BulkActionBar` for bulk status change and (admin-only) bulk delete. Backend: `POST /api/work-items/bulk-update`, `POST /api/work-items/bulk-delete`, dashboard endpoints `GET /api/dashboard/summary|team-summary|attention-items` (all admin-gated via `require_admin`).
- Tested via testing_agent: 19/19 new pytest + 20/20 regression, all frontend flows verified. Fixed minor issue: bulk-update now skips permission-violating rows instead of aborting the batch.

## Backlog (Prioritized)
- **P1**: Review workflow refinements (dedicated review queue view for managers).
- **P1**: CSV/XLSX data import + normalization (client/employee name cleanup, date normalization) — user will supply cleaned file.
- **P1**: Bulk operations (multi-row status update, bulk assign), Excel/CSV export.
- **P2**: Real authentication (JWT or Emergent Google Auth) replacing role switcher — call `integration_expert` before implementing.
- **P2**: Parent-deliverable grouping, activity history/audit log, comments, saved filters, notifications, Google Drive/Sheets integration, attachments, client portal.

## Known Non-Blocking Notes (from testing_agent code review)
- `@app.on_event` startup is deprecated FastAPI pattern (works fine, migrate to lifespan later if needed).
- PATCH silently drops disallowed fields for members instead of returning 400 — acceptable for MVP UX (fields aren't rendered as editable in UI anyway).
- No pagination on work-items list yet (fine at current scale).

## Test Credentials
No login exists. See `/app/memory/test_credentials.md`.
