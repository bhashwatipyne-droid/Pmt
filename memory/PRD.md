# PRD — Spreadsheet-first Project Management Tool (working title: PMT)

## Original problem statement
A simple, spreadsheet-first project management tool with:
- **Members / Managers**: a Google Sheets-like Work Sheet for logging daily activities.
- **Admins**: dashboard, projects, team, approvals, clients — a full admin cockpit inspired by the "PMT Prototype" screen recording + reference screenshots the user shared.

## Explicit user decisions (locked)
- Row granularity: one row = one work activity.
- Deferred until later: parent-deliverable grouping (superseded by real Project→Deliverable hierarchy, see Phase 3).
- **Authentication**: skipped for now. Demo role switcher via localStorage `acting_user_id`. Real registration/approval flow is deferred (Team page's "New Approvals" panel is a placeholder).
- Historical import: user will supply a cleaned CSV/XLSX when import phase runs. Do NOT seed from the old pasted chat data.
- Build order: Sheet → Admin Dashboard → Projects → Wire Sheet to Deliverables → Approvals → Team → Clients → Dashboard redesign → Sidebar polish.
- Work Sheet ↔ Project linkage: **rows belong to a Deliverable** (via project_id + deliverable_id + stage). Confirmed by user.
- Stages are **fixed**: Content → Design → Animate → Finish.
- Departments are **fixed** (backend-managed): Content, Design, Animation, Finish, Administration.
- Recommended status workflow (member workflow): Not Started, Ongoing, Ready for Review, Changes Requested, Closed.
- Deliverable stage_status workflow (approvals workflow): Not Started, In Progress, Ready for Review, Changes Requested, Completed.
- **Approvals queue** shows only `Ready for Review` — rejected items go back to the assignee and disappear from the queue.

## Data model (implemented)
```
Client (id, name, contact_person, status)
  └── Project (id, code, name, client_id, start/end date, poc_id, status ∈ {Planning, Active, In Rework, Completed})
        └── Deliverable (id, project_id, name, type, owner_id, start_dt, end_dt, current_stage, stage_status, last_review_note/action/reviewer_id)
              └── WorkItem (id, work_date, project_id, deliverable_id, stage, deliverable_name, type, category, version, time_taken_minutes, creator_id, reviewer_id, remarks, status)

User (id, name, email, role ∈ {admin, manager, member}, department, active)
```

## Roles & visibility
- **Admin**: 5 admin tabs (Dashboard, Projects, Team, Approvals, Clients) + Work Sheet.
- **Manager**: Approvals + Work Sheet.
- **Member**: Work Sheet only. Can edit only rows they created. Backend enforces row-level 403.

## Implemented (Phases 1-7)
### Phase 1 — Clients (minimal)
- `GET/POST /api/clients` — list + admin-only add.
- Frontend `/clients` page with search, table (Name/Contact/Status/Projects), Add Client modal.
- AMFI seeded on startup.

### Phase 2 — Projects
- Full CRUD for Projects + inline Deliverables at create time.
- Chart View (kanban 4-column: Planning/Active/In Rework/Completed) + List View toggle.
- 4 metric cards: Active Projects, In Rework, Due This Week, Deliverables.
- ProjectCard with client, POC, stage dots (Content/Design/Animate/Finish counts), collaborators, deadline, "Open →".
- Auto-generated project codes (`proj` + 9 random chars).

### Phase 3 — Work Sheet ↔ Projects
- WorkItem model extended with `project_id`, `deliverable_id`, `stage`.
- New columns in the sheet: **Project / Deliverable Link / Stage** (inline dropdowns).
- Cascading: deliverable dropdown filters by selected project.
- Sticky context: last-used project/deliverable/stage saved to localStorage → auto-fills new rows (Google Sheets-like feel).
- Bulk-assign popover: select rows → pick project + deliverable + stage → Apply.
- Row-level permissions: members see the new selects disabled on other members' rows (backend also enforces 403).

### Phase 4 — Approvals
- `/api/approvals` returns deliverables in `Ready for Review`.
- Approve → advances stage (Content→Design→Animate→Finish, Finish→Completed).
- Reject → sets `Changes Requested` with note; disappears from queue.
- `/approvals` page with cards + note textarea + Approve / Send Back buttons.
- Visible to admin + manager. Members see "admins/managers only" notice.

### Phase 5 — Team
- `/api/users` POST/PATCH (admin-only), with role + department validation.
- `/team` page: New Approvals empty panel (auth deferred), Previous Approvals roster with editable Department + Role dropdowns + Save Role, Active/Inactive badge, "+ Add Team Member" modal.

### Phase 6 — Dashboard (redesigned, project-centric)
- `/api/dashboard/overview` returns project counts, deliverable stage counts, needs_review, due_this_week, hours logged.
- `/dashboard` page: 4 metric cards (Active Projects / Needs Review / Due This Week / Total Deliverables), Deliverable Progress by Stage panel, Recent Projects list, Pending Approvals side panel.

### Phase 7 — Sidebar/Shell polish
- Dark navy sidebar matching "PMT Prototype" reference: brand + 6 nav items (role-filtered), user footer card, Logout (disabled, auth deferred).
- Top bar with breadcrumb + role switcher + notification bell.

## Testing provenance
- iteration_1.json: Work Sheet MVP — 20/20 backend, all frontend flows.
- iteration_2.json: Admin Dashboard + bulk actions — 19/19 backend, all flows.
- **iteration_3.json**: Phases 3-7 — 26/26 new backend tests + full frontend regression, 100% pass. Two minor UX polish items fixed in-line (low-contrast "Acting as" label; member row-level select disabled).
- User acceptance:
  - Work Sheet MVP: user-confirmed working.
  - Admin Dashboard + checkboxes: user-confirmed working.
  - Projects module (Phase 2): user-confirmed working.
  - Phases 3-7: shipped + testing-agent-verified, awaiting user confirmation.

## Recent additions (Feb 2026, post-Phase 7)
- **Project Detail View** (`/projects/:id`): header w/ status/POC/dates, per-stage counts, Deliverables list w/ inline Approve/Send Back for Ready-for-Review items, Work Log filtered to this project.
- **Deliverable Types** updated to the user's 29 domain-specific list (Internal Meets, Client Meets, Campaign Ideation variants, Emailers, Carousel, GIF, Reels, Data Research SMI/Web, etc). Old generic types removed.
- **Sheet-like inline row entry**: replaced "Add Row" button with a green-tinted draft row at the top of the sheet. Any field change triggers row creation on blur (like Google Sheets). Sticky project/deliverable/stage context carried across new rows via localStorage.
- **Client Editing**: pencil icon on Clients now opens a proper Edit modal with rename, contact update, and Archive/Restore (status Active↔Inactive). Backend PATCH /api/clients/{id} added, admin-only.
- **Work-items filtering**: /api/work-items now supports `project_id` and `deliverable_id` query params for the project detail view.

## Backlog / next candidates (P1)
- **CSV/XLSX import** for historical work items (user will supply cleaned file).
- **Export** Sheet to CSV/Excel.
- **Deliverable CRUD from Project Detail** (add/edit/delete deliverables directly in a project).
- **Real auth** (registration + admin approval + roles) — must go through integration playbook.
- Activity history / audit log on deliverables and work items.
- Notifications (in-app for approvals & new assignments).
- Refactor: split `server.py` into routers (users, projects, deliverables, approvals, dashboard, work_items).

## Architecture / operational notes
- Backend: FastAPI + Motor (MongoDB) on port 8001, `/api` prefix.
- Frontend: React + shadcn/ui + Tailwind on port 3000. Sonner for toasts.
- Preview URL comes from `REACT_APP_BACKEND_URL` in `/app/frontend/.env`.
- Env: `MONGO_URL`, `DB_NAME` in `/app/backend/.env`.
- Role simulation: `X-User-Id` header on API; frontend stores selection in `localStorage.acting_user_id`.
- Do NOT reintroduce bulk-update behaviour that aborts the entire batch on one permission-violating row — current behaviour is skip-and-continue.
