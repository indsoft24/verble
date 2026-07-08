# Quotation — Live Webinar & Meeting Module (Agora)

**Project:** Verble.in — Coaching Platform  
**Feature:** In-platform live webinars with Agora real-time video  
**Reference document:** [live-webinar-agora-plan.md](./live-webinar-agora-plan.md)  
**Quotation date:** 30 June 2026  
**Validity:** 30 days from quotation date  
**Currency:** Indian Rupees (INR), exclusive of GST unless stated otherwise

---

## 1. Executive summary

This quotation covers design, development, and integration of a **live webinar module** within the existing Verble coaching platform. The module allows administrators to create live sessions, share join links with learners, and conduct real-time video sessions powered by **Agora**—without redirecting users to third-party tools such as Zoom or Google Meet.

Three implementation packages are offered. All packages include secure backend token generation, admin session management, login-protected join flow, and integration with the existing Verble user authentication system. Packages differ in **level of audience interaction**, **chat capabilities**, and **whether learners can publish audio/video**.

| Package | Investment | Timeline | Best for |
|---------|------------|----------|----------|
| **Basic** | ₹6,000 – ₹7,000 | 3–4 working days | Structured webinars; host teaches, learners ask questions in writing |
| **Moderate** | ₹10,000 – ₹12,000 | 4–6 working days | Interactive webinars with real-time group chat and moderation |
| **Advance** | ₹18,000 – ₹20,000 | 7–10 working days | Small-group live classes where learners can speak on camera |

---

## 2. Scope common to all packages

The following is included in every tier unless explicitly marked as an upgrade in a higher package.

### Platform integration

- Agora Web SDK integration in the React frontend (`coaching-platform-frontend`)
- Secure RTC token API on the Node.js backend (`coaching-platform-backend`)
- New `LiveSession` data model (MongoDB) with channel name, schedule, status, and host assignment
- Dedicated live join route: `/live/:sessionId`
- Admin panel page: create session, view list, copy share link, start/end session
- Login requirement for joining (reuses existing auth)
- Host role: admin/instructor with camera, microphone, and screen-share controls
- Session states: scheduled → live → ended, with appropriate UI messaging
- Optional link to an existing `WEBINAR` offer so `/webinar/:slug` can show **Join Live**
- Environment configuration documentation (`AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`)
- Basic testing on staging/production HTTPS environment
- Handover note for admin usage (how to create and run a session)

### Not included in any package (client responsibility)

| Item | Notes |
|------|-------|
| Agora account fees | Billed directly by Agora based on usage (minutes × participants) |
| GST / taxes | Added as applicable on the quoted development fee |
| Agora account creation | Client provides or approves Agora project credentials |
| Ongoing maintenance retainer | Quoted separately if required after delivery |
| Native mobile apps | Browser-based join only |
| Cloud recording to Bunny CDN | Available as a future add-on |
| Subscription / payment gate before join | Available as a future add-on |

---

## 3. Package details

---

### Package A — Basic  
**₹6,000 – ₹7,000** · **3–4 working days**

#### Overview

The **Basic** package delivers a production-ready **broadcast-style webinar**: the instructor appears on video with audio; learners watch inside Verble and submit written questions. Interaction is intentionally minimal and controlled—ideal for large batches, marketing webinars, and sessions where the host must maintain focus without managing open chat or multiple speakers.

This package aligns with the approved technical plan: **admin-only video and audio**, plus **Q&A submit with a host-side question panel**.

#### Deliverables

**Live video (host only)**

- Admin joins as publisher with camera, microphone, and screen share
- Learners join as audience (subscriber)—view and listen only; no camera or mic access
- Live badge, session title, waiting state (“Host has not started”), and ended state
- Token refresh handling for sessions running beyond one hour

**Q&A — question submit + host panel**

- Learner UI: single “Ask a question” field with submit confirmation
- Host UI: side panel listing incoming questions (pending, answered, dismissed)
- Host actions: mark answered, dismiss inappropriate questions
- Questions visible to host only (learners do not see each other’s questions)
- Rate limiting on submissions to reduce spam (e.g. one question per user per 2 minutes)
- Backend `LiveQuestion` model and REST APIs with polling-based updates (3–5 second refresh)

**Admin & sharing**

- Admin **Live Sessions** page: create, schedule, copy link, go live, end session
- Shareable URL: `https://verble.in/live/{sessionId}`
- Optional attachment to an existing webinar offer; **Join Live** on webinar landing page when session is active

**Out of scope for Basic**

- Real-time open chat between learners
- Learner video or audio
- Raise hand / speaker promotion
- Question upvoting or pinned “now answering” banner on learner screen
- WebSocket-based real-time updates (polling only)
- Full admin CRUD UI for webinar offers (dropdown from existing offers only)

#### Timeline breakdown

| Day | Activity |
|-----|----------|
| Day 1 | Backend: `LiveSession` model, token API, admin CRUD endpoints |
| Day 2 | Frontend: `/live/:id` page, Agora host/audience roles, admin sessions page |
| Day 3 | Q&A APIs, learner submit UI, host question panel |
| Day 4 | Webinar page hook-up, testing, bug fixes, handover |

#### Investment

| | |
|--|--|
| **Price range** | **₹6,000 – ₹7,000** |
| **Final price** | Fixed within range after scope confirmation call |
| **Payment terms** | 50% on approval · 50% on delivery and acceptance |

---

### Package B — Moderate  
**₹10,000 – ₹12,000** · **4–6 working days**

#### Overview

The **Moderate** package includes everything in **Basic**, plus a **proper real-time chat system** for live sessions. This suits batches where learners benefit from seeing discussion flow, asking quick follow-ups, and feeling more engaged—while the admin retains moderation control.

Chat is built for webinar use: structured, moderated, and suitable for tens to low hundreds of participants—not a full social messaging product.

#### Everything in Basic, plus

**Real-time live chat**

- Persistent chat panel on the live page for all participants
- Messages delivered with low latency (WebSocket or Agora RTM—selected during implementation for best fit)
- Learners and host can send text messages during the live session
- Message timestamps and sender display name (from logged-in profile)
- Host moderation tools: delete/hide messages, optional slow-mode (delay between messages)
- Optional “questions only” or “host announcements” channel mode configurable per session
- Chat history scoped to session (not stored as permanent course content unless export is requested)

**Enhanced Q&A (upgrade over Basic)**

- Pin a question so learners see “Host is answering: …”
- Upvote on questions; host panel sorted by popularity
- Pinned and answered questions visible on learner view (read-only)

**Improved admin & UX**

- Waiting room with countdown before host starts
- Live indicator on user dashboard / promo CTA support documented for admin
- WebSocket-based updates for chat and questions (no polling delay)
- Additional QA pass for concurrent users (20–50 simultaneous)

**Out of scope for Moderate**

- Learner camera or microphone
- Raise hand with automatic role promotion to speaker
- Breakout rooms, polls, whiteboard
- Cloud recording
- Full webinar offers admin CRUD (can be quoted as small add-on: ~₹1,500–₹2,000)

#### Timeline breakdown

| Day | Activity |
|-----|----------|
| Days 1–2 | Full Basic package (as above) |
| Days 3–4 | Real-time chat backend + frontend panel, moderation tools |
| Day 5 | Enhanced Q&A (pin, upvote), waiting room, dashboard hooks |
| Day 6 | Load testing, polish, documentation, handover |

#### Investment

| | |
|--|--|
| **Price range** | **₹10,000 – ₹12,000** |
| **Upgrade from Basic** | +₹4,000 – ₹5,000 over Basic tier |
| **Payment terms** | 50% on approval · 50% on delivery and acceptance |

---

### Package C — Advance  
**₹18,000 – ₹20,000** · **7–10 working days**

#### Overview

The **Advance** package transforms the webinar into an **interactive live classroom**: both admin and learners can use **audio and video**. This is appropriate for small groups, interview practice, speaking clubs, and premium batches where two-way participation is essential.

This tier requires careful role management, speaker limits, and moderation—implementation complexity is significantly higher than broadcast-only modes.

#### Everything in Moderate, plus

**Two-way audio and video**

- Learners join with camera and microphone capability (browser permissions)
- Default mode: learners start muted with camera off; host controls when they speak
- **Raise hand** flow: learner requests to speak → host approves → temporary publisher role / unmute
- Automatic demotion back to audience after host ends learner turn (configurable timeout)
- Dynamic Agora token role updates (subscriber ↔ publisher) on approval
- Speaker grid or spotlight layout (host large, active speakers smaller)
- Maximum simultaneous speakers limit (e.g. 4–6) to protect session quality—configurable

**Host controls**

- Mute all learners
- Approve / reject raise-hand requests
- Remove learner from session (kick)
- Disable all learner video (audio-only mode for learners)

**Session quality & safety**

- Network quality indicator for host
- Reconnection handling if learner drops and rejoins
- Extended testing for multi-speaker scenarios (5–15 active participants)
- Admin guide for managing interactive sessions

**Out of scope for Advance**

- Unlimited simultaneous speakers (platform and Agora limits apply)
- Native iOS/Android apps
- Automatic cloud recording and upload to course library
- Breakout rooms
- AI transcription or captions

#### Timeline breakdown

| Day | Activity |
|-----|----------|
| Days 1–3 | Moderate package foundation (live + chat + Q&A) |
| Days 4–6 | Learner AV permissions, raise hand, role/token switching |
| Days 7–8 | Host moderation console, speaker layout, mute/kick controls |
| Days 9–10 | Multi-user testing, edge cases, performance tuning, handover |

#### Investment

| | |
|--|--|
| **Price range** | **₹18,000 – ₹20,000** |
| **Upgrade from Moderate** | +₹8,000 – ₹8,000 over Moderate tier |
| **Payment terms** | 40% on approval · 30% on mid-delivery demo · 30% on final acceptance |

---

## 4. Side-by-side comparison

| Capability | Basic | Moderate | Advance |
|------------|:-----:|:--------:|:-------:|
| Admin video & audio | ✓ | ✓ | ✓ |
| Screen share (host) | ✓ | ✓ | ✓ |
| Learner watch-only video | ✓ | ✓ | ✓ |
| Written question submit | ✓ | ✓ | ✓ |
| Host question panel | ✓ | ✓ | ✓ |
| Real-time group chat | — | ✓ | ✓ |
| Chat moderation | — | ✓ | ✓ |
| Question pin & upvote | — | ✓ | ✓ |
| Learner camera & mic | — | — | ✓ |
| Raise hand → speak | — | — | ✓ |
| Host mute / kick controls | — | — | ✓ |
| Admin live sessions page | ✓ | ✓ | ✓ |
| Webinar page Join Live | ✓ | ✓ | ✓ |
| Login required | ✓ | ✓ | ✓ |
| **Price (INR)** | **6K – 7K** | **10K – 12K** | **18K – 20K** |
| **Timeline** | **3–4 days** | **4–6 days** | **7–10 days** |

---

## 5. Recommended selection guide

| Your use case | Recommended package |
|---------------|---------------------|
| Weekly webinar for 50–200 learners; host teaches, Q&A at end | **Basic** |
| Engaged batches; learners chat during session; host moderates | **Moderate** |
| Speaking practice, small premium groups, 1:1-style interaction | **Advance** |

**Our recommendation for Verble’s current product direction:** start with **Basic** or **Moderate**. The existing platform is optimised for structured learning and marketing webinars; **Basic** matches the approved technical plan and can be upgraded later without rework of core session infrastructure.

---

## 6. Assumptions & terms

### Assumptions

1. Existing Verble codebase (`coaching-platform-frontend`, `coaching-platform-backend`) remains the deployment target.
2. Client provides Agora App ID and App Certificate before development starts.
3. Production site is served over HTTPS (required for browser media APIs).
4. One round of revision per delivered milestone is included; scope changes are re-quoted.
5. “Working days” exclude weekends and public holidays unless otherwise agreed.

### Warranty

- **14 days** bug-fix warranty on delivered scope after final acceptance (defects in implemented features only; not Agora outages or client infrastructure issues).

### Optional add-ons (quoted separately)

| Add-on | Indicative range |
|--------|------------------|
| Cloud recording → Bunny / course library | ₹4,000 – ₹6,000 |
| Webinar offers full admin CRUD UI | ₹1,500 – ₹2,000 |
| Email / in-app reminder before live session | ₹2,000 – ₹3,000 |
| Attendance log (join time, duration per user) | ₹2,500 – ₹3,500 |
| Subscription check before join | ₹2,000 – ₹3,000 |

---

## 7. Acceptance

To proceed, please confirm:

- [ ] Selected package: **Basic** / **Moderate** / **Advance**
- [ ] Agreed investment within stated range: ₹_____________
- [ ] Target start date: _______________
- [ ] Agora credentials will be provided by: _______________
- [ ] Technical plan reviewed: [live-webinar-agora-plan.md](./live-webinar-agora-plan.md)

| | |
|--|--|
| **Client name** | |
| **Authorised signatory** | |
| **Signature** | |
| **Date** | |

---

*This quotation is for development services only. Third-party costs (Agora, hosting, SMS, etc.) are borne by the client. Detailed technical specification is documented in the companion plan file.*
