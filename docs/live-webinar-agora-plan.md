# Live Webinar Plan — Agora + Q&A (Pending Approval)

**Status:** Draft — awaiting client approval before build  
**Last updated:** 2026-06-30  
**Scope:** Minimal viable live webinar inside Verble

---

## Summary (client pitch)

Admin creates a live session from the dashboard and shares one Verble link with all users—or attaches it to an existing webinar offer. Students join in the browser after login, watch the instructor live (video + audio), and ask questions via a simple text box. Questions appear in the host/admin panel; the instructor answers on camera. **Only admin/host publishes video and audio.** Students are audience only in v1.

---

## Goals

| Goal | Approach |
|------|----------|
| Admin creates and shares join link | `/live/:sessionId` + optional link to existing `WEBINAR` offer |
| Users join inside Verble | Agora Web SDK on a dedicated live page |
| Only admin has video + audio | Host = publisher; students = audience (subscriber) |
| Minimal student ↔ admin interaction | Q&A submit + host panel (text questions, verbal answers) |
| Reuse existing webinar marketing | Hook into `Offer` type `WEBINAR` and `WebinarPage` |

---

## Out of scope for v1

- Students on camera or mic
- Raise hand / promote audience to speaker
- Open student-to-student chat
- Breakout rooms, polls, whiteboard
- Cloud recording → Bunny (phase 3)
- Native mobile app
- Paid-webinar / subscription gate before join (phase 3)

---

## Architecture

```
Admin creates session → Backend stores channel + schedule
        ↓
Share link: https://verble.in/live/{id}
        ↓
User opens link → Login check → Backend issues Agora RTC token (audience)
Admin opens same link → Token with host/publisher role
        ↓
Live page: admin video/audio | students watch
        ↓
Student submits question (POST) → MongoDB → Host panel (poll/list)
        ↓
Host answers on mic; marks question answered
```

### Agora components

| Item | Where | Purpose |
|------|--------|---------|
| App ID | Frontend (public) | Identify Agora project |
| App Certificate | Backend only | Sign RTC tokens |
| Channel name | Per session (auto-generated) | One room per webinar |
| RTC token | Generated on demand | Secure join; never stored in DB |

**Rule:** App Certificate and token generation stay on the backend only.

### Roles (v1)

| Role | Who | Agora role | Video | Audio |
|------|-----|------------|-------|-------|
| Host | Admin / instructor | Publisher | Yes | Yes |
| Audience | Logged-in students | Subscriber | No | No |

---

## Data models

### `LiveSession` (new)

| Field | Type | Notes |
|-------|------|-------|
| `title` | String | Display name |
| `channelName` | String | Unique, auto-generated (e.g. `webinar-batch-21`) |
| `offerId` | ObjectId? | Optional link to existing `WEBINAR` offer |
| `scheduledStart` | Date | When join UI becomes available |
| `scheduledEnd` | Date | When session window closes |
| `status` | Enum | `scheduled` → `live` → `ended` |
| `hostUserId` | ObjectId | Admin who runs the session |
| `requireLogin` | Boolean | Default `true` |
| `createdBy` | ObjectId | Admin who created it |

### `LiveQuestion` (new)

| Field | Type | Notes |
|-------|------|-------|
| `sessionId` | ObjectId | Ref `LiveSession` |
| `userId` | ObjectId | Who asked |
| `userName` | String | Display name from profile |
| `text` | String | Question text |
| `status` | Enum | `pending` \| `answered` \| `dismissed` |
| `pinned` | Boolean | Default false; host can pin “answering next” |
| `createdAt` | Date | Auto |
| `answeredAt` | Date? | When host marked answered |

---

## API surface

### Live sessions

| Method | Route | Access | Purpose |
|--------|-------|--------|---------|
| POST | `/api/live-sessions` | Admin | Create session |
| GET | `/api/live-sessions` | Admin | List sessions |
| GET | `/api/live-sessions/:id` | User (auth if required) | Session info (title, status, times) |
| PATCH | `/api/live-sessions/:id` | Admin | Update status (`live` / `ended`), edit metadata |
| POST | `/api/live-sessions/:id/token` | Logged-in user | Returns `{ appId, channel, token, uid, role }` |

**Token rules:**

- Requesting user is host → `publisher`
- Everyone else → `subscriber` (audience)
- Token TTL ~1 hour; refresh if session runs longer

### Q&A

| Method | Route | Access | Purpose |
|--------|-------|--------|---------|
| POST | `/api/live-sessions/:id/questions` | Logged-in user | Submit question |
| GET | `/api/live-sessions/:id/questions` | Host (admin) | All questions for session |
| PATCH | `/api/live-sessions/:id/questions/:qid` | Host | `answered` / `dismissed` / `pinned` |

**Student GET (optional v1):** only their own submitted questions, or none (submit-only UX).

**Rate limit:** e.g. 1 question per user per 2 minutes per session.

**Host panel refresh:** poll every 3–5 seconds (WebSocket optional in phase 2).

---

## User flows

### Flow A — Standalone live session

1. Admin → **Live Sessions** → Create (title, schedule, optional offer link).
2. System shows share link: `https://verble.in/live/{id}` + **Copy**.
3. Admin shares link (WhatsApp, email, promo banner, etc.).
4. At start time, admin opens link → **Go Live** → camera/mic on.
5. Students open link → login → watch stream → use **Ask a question**.
6. Admin sees questions in side panel → answers on mic → marks **Answered**.
7. Admin → **End session** → status `ended`; join disabled.

### Flow B — Attached to existing webinar offer

1. Admin has (or creates) `WEBINAR` offer with title, dates, description.
2. Admin creates `LiveSession` with `offerId` set.
3. `WebinarPage` (`/webinar/:slug`):
   - Before window: countdown / “Starts at …”
   - During `live`: **Join Live** → in-app `/live/{id}` (not external `linkUrl`)
   - After `ended`: “Session ended” (recording link = phase 3)

### Flow C — External link fallback (unchanged)

Existing `Offer.linkUrl` can still point to Zoom/Meet if admin prefers; Agora sessions use Verble `/live/` URLs.

---

## Frontend pages & UI

### 1. `/live/:sessionId` (main join page)

**Audience view:**

- Agora remote video (host only)
- Session title + “Live” badge
- **Ask a question** — single text field + Send
- Confirmation: “Question submitted”
- Leave button

**Host view (same URL, role from token):**

- Local preview + camera/mic/screen-share toggles
- **Go Live** / **End session** controls
- **Questions panel** (right sidebar or bottom drawer):
  - List: pending → newest or pinned first
  - Actions: Pin, Mark answered, Dismiss
- Optional: count of pending questions

**Pre-live states:**

- `scheduled` + before start: “Session starts at {time}”
- `scheduled` + host not started: “Waiting for host to start”
- `ended`: “This session has ended”

### 2. Admin — Live Sessions (`/admin/live-sessions`)

- List: title, status, schedule, linked offer, copy link
- Create form: title, start/end, optional webinar offer dropdown, require login
- Actions: Copy link, Go to live room, End session

### 3. Admin — Webinar offers UI (gap today)

- v1 minimum: dropdown on Live Session create pulls active `WEBINAR` offers
- Phase 2: full CRUD for offers (create/edit `linkUrl`, dates) — API exists, UI missing

### 4. Updates to existing pages

| Page | Change |
|------|--------|
| `WebinarPage` | If linked `LiveSession` is `live`, show **Join Live** → `/live/{id}` |
| `PromoBanner` / dashboard CTA | Admin can set `ctaUrl` to `/live/{id}` or `/webinar/{slug}` |
| Admin nav | Add “Live Sessions” |

---

## Q&A behavior (detailed)

### Student

- Must be logged in
- One text field; max length e.g. 500 chars
- No see-all-chat; no replies thread in v1
- Optional: show “You asked: …” for their own last question

### Host

- Sees all `pending` questions in real time (polling)
- Answers **verbally on video** (primary)
- Marks question **Answered** when done
- Can **Dismiss** spam
- Can **Pin** one question (optional UI: “Now answering: …” on student view — phase 2)

### Moderation rules

- Login required to submit
- Rate limit per user
- Host-only visiblity for full question list (students do not see each other’s questions in v1)
- Host can dismiss inappropriate questions

---

## Environment variables (new)

Backend `.env`:

```
AGORA_APP_ID=
AGORA_APP_CERTIFICATE=
AGORA_TOKEN_EXPIRY_SECONDS=3600
```

Frontend (build-time or from token response):

- `appId` returned from token API (no certificate on frontend)

---

## Phased build plan

### Phase 1 — MVP (build after approval)

- [ ] Agora project + env config
- [ ] `LiveSession` model + admin CRUD APIs
- [ ] Token endpoint (host vs audience roles)
- [ ] `/live/:sessionId` page — Agora RTC, host AV only
- [ ] Admin Live Sessions page — create, copy link, start/end
- [ ] `LiveQuestion` model + submit + host list APIs
- [ ] Q&A UI on live page (student submit + host panel)
- [ ] Login gate for join + ask
- [ ] `WebinarPage` integration when `offerId` linked

**Done when:** Admin runs a live class; 20+ students watch; students submit questions; host sees panel and answers on camera.

### Phase 2 — Polish

- [ ] Admin UI for webinar offers (CRUD)
- [ ] Waiting room copy + pinned question on student screen
- [ ] Question upvote (host sees top questions)
- [ ] In-app / email reminder before start
- [ ] Live badge on user dashboard

### Phase 3 — Optional later

- [ ] Agora cloud recording → Bunny HLS (reuse course video pipeline)
- [ ] Raise hand → temporary speaker role
- [ ] Attendance log (join time, duration)
- [ ] Subscription check before token issue

---

## Dependencies & prerequisites

| Requirement | Notes |
|-------------|-------|
| HTTPS on verble.in | Required for browser camera/mic |
| Agora account | Free tier for dev; production pricing by minutes × users |
| MongoDB | New collections |
| Existing auth | JWT/session for login gate |
| Admin role | Reuse current admin middleware |

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Large audience load | Audience role + subscriber tokens; verify Agora plan limits |
| Token expiry mid-session | Refresh token API; auto-renew on client before expiry |
| Chat spam | Rate limit + host dismiss |
| No admin offers UI | Minimal dropdown from API for v1 |
| Browser permissions | Host only needs cam/mic; students do not |

---

## Approval checklist

Before development starts, confirm:

- [ ] Client approves **admin-only video/audio** (students watch only)
- [ ] Client approves **Q&A via text + host panel** (no student mic in v1)
- [ ] Client approves **Verble-hosted links** (`/live/...`) vs external Zoom links
- [ ] Agora account / billing owner identified
- [ ] Phase 1 scope only (no recording, no raise hand)

**Approved by:** _________________ **Date:** _________________

---

## Reference — current codebase touchpoints

| Area | Path / note |
|------|-------------|
| Webinar landing | `coaching-platform-frontend/src/pages/WebinarPage.tsx` |
| Offer model (`WEBINAR`, `linkUrl`) | `coaching-platform-backend/src/models/Offer.js` |
| Offers API | `coaching-platform-backend/src/controllers/offerController.js` |
| Webinar leads (marketing) | `AdminWebinarLeadsPage.tsx` — separate from live Q&A |
| Video playback (recorded) | Bunny HLS — not used for live v1 |
| Agora | Not integrated yet |

---

*After approval, implementation starts with Phase 1 backend models + token API, then live page, then admin UI, then Q&A, then WebinarPage hook.*
