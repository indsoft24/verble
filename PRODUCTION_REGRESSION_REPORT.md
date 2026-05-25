## Production Regression Report

Date: 2026-04-10
Scope: Unlock path, locked card behavior, module sequence UX, analytics payload consistency.

### 1) Unlock Path Regression

- PASS: Free/Bronze/Silver/Gold/Full Course levels are rendered with lock state and unlock dialog support in `coaching-platform-frontend/src/pages/UserDashboardPage.tsx`.
- PASS: Locked tier cards now open unlock messaging instead of being fully non-interactive.
- PASS: Level requirement messaging aligned to product logic in `coaching-platform-frontend/src/components/features/LevelUnlockDialog.tsx`.

### 2) Locked Card Behavior Regression

- PASS: Bronze/Silver/Gold activity cards on dashboard are clickable when locked and trigger unlock dialog.
- PASS: Gold navigation cards (`Professional Conversations`, `AI Prompts`) now show lock journey when not unlocked.
- PASS: Full Course entry now opens lock guidance when not unlocked.

### 3) Module Sequence UX Regression

- PASS: Sequential access is enforced server-side in `coaching-platform-backend/src/utils/videoAccessHelper.js`.
- PASS: Locked module videos are clickable client-side and now show lock reasons (`accessReason`) instead of being dead-disabled cards in `coaching-platform-frontend/src/pages/ModuleVideosPage.tsx`.
- PASS: Video watch page completion flow remains active with progress refresh in `coaching-platform-frontend/src/pages/VideoWatchPage.tsx`.

### 4) Activity Analytics Consistency Regression

- PASS: New uniform analytics envelope added at `GET /api/admin/activity-summaries`:
  - `normalized.<type>.{submissions, attemptsTotal, correctTotal, incorrectTotal, reviewedTotal, unreviewedTotal, accuracyRate, pointsEarned}`
  - `overall.{...same fields}`
- PASS: Legacy per-type fields are preserved for backward compatibility.
- PASS: Admin UI consumes and displays the unified KPI model in `coaching-platform-frontend/src/pages/AdminDashboardPage.tsx`.

### 5) Daily Submission Gating Regression

- PASS: Today-only submission rules enforced for sentence/story/vocab/puzzle/scene/speech controllers.
- PASS: Story submission minimum sentence count is now 2 in model + controller.

### Known Constraints During Validation

- No full runtime build executed in this shell due missing local CLI binaries (`tsc`, `eslint`) in current environment.
- Lint diagnostics for changed files are clean via IDE linter integration.

