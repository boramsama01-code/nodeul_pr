# PROJECT RULES

## Core Principle

This project is NOT a marketing website.

This is a real operational workflow SaaS for Nodeul Island promotion management.

Prioritize:
- real functionality
- workflow clarity
- operational usability
- database integrity

Do NOT prioritize decorative UI work.

---

# Critical Rules

## DO NOT

- Do not create mock data
- Do not create fake dashboards
- Do not replace real DB data with local arrays
- Do not redesign UI unless explicitly requested
- Do not rebuild existing architecture unnecessarily
- Do not remove existing functionality
- Do not generate placeholder cards pretending to be functional

---

# Required Stack

Frontend:
- Next.js App Router
- React
- TailwindCSS
- shadcn/ui

Backend:
- Supabase

Database:
- PostgreSQL

Storage:
- Supabase Storage

Authentication:
- Supabase Auth

Email:
- Resend

---

# Core Architecture

Everything must be EVENT-CENTRIC.

Each event must contain:

- promotion requests
- approval states
- uploaded assets
- asset versions
- comments
- schedules
- posting history
- email logs

All workflows must stay connected inside the Event Detail Page.

---

# Workflow

Event Creation
→ Promotion Request
→ Admin Review
→ Approval / Revision Request
→ Asset Upload
→ Asset Versioning
→ Final Approval
→ Posting Schedule
→ Posted

---

# File Versioning Rules

Must preserve:
- upload history
- previous versions
- timestamps
- admin final selection
- revision requests

Never overwrite previous versions.

---

# Admin UX Rules

Admins must immediately see:
- pending approvals
- latest uploads
- revision requests
- schedule conflicts
- posting deadlines

Prioritize compact information density.

Avoid oversized cards and excessive empty spacing.

---

# Design Direction

The UI should feel like:

- Linear
- Notion
- Airtable
- Jira

with subtle Nintendo/pixel-art flavor.

NOT:
- flashy retro website
- neon cyberpunk
- gimmicky pixel art site

Pixel art should be subtle and secondary to usability.

---

# Before Making Changes

Always:
1. preserve working functionality
2. preserve DB schema
3. preserve auth flow
4. preserve upload/version logic
5. preserve event-centric structure

Never rewrite large sections unnecessarily.
