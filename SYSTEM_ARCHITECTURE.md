# SYSTEM ARCHITECTURE

## Project Name

Nodeul Island Promotion Workflow System

---

# Purpose

This system replaces fragmented workflows currently handled through:
- Notion
- Google Sheets
- manual approval processes

The goal is to centralize all promotion workflows into a single operational SaaS platform.

---

# Core Concept

Everything revolves around EVENTS.

Each Event acts as a complete operational container.

Inside each Event:
- promotion applications
- approval states
- uploaded assets
- version history
- schedules
- admin comments
- email history

must remain connected.

---

# Tech Stack

## Frontend
- Next.js App Router
- React
- TailwindCSS
- shadcn/ui
- Framer Motion

## Backend
- Supabase

## Database
- PostgreSQL

## Storage
- Supabase Storage

## Authentication
- Supabase Auth

## Email
- Resend

---

# Main User Roles

## Client (Event Organizer)
Can:
- create events
- submit promotion requests
- upload promotional assets
- revise submissions
- check approval status

## Admin
Can:
- review events
- approve/reject requests
- request revisions
- manage schedules
- select final asset versions
- send emails

---

# Main Pages

## Dashboard
Shows:
- pending approvals
- latest uploads
- revision requests
- schedule conflicts
- posting deadlines

## Event Detail Page
Contains:
- event info
- promotion requests
- approval status
- uploaded assets
- asset versions
- schedules
- comments
- email logs

This is the most important page in the system.

---

# File Upload System

Files are stored in:
- Supabase Storage

Metadata stored in:
- PostgreSQL

Each upload creates:
- asset record
- version history entry

Previous versions must remain preserved.

---

# Authentication Flow

Supabase Auth:
- email/password login
- role-based access
- protected routes

Clients can only access their own events.

Admins can access all events.

---

# Email System

Emails sent via:
- Resend API

Email types:
- submission confirmation
- approval notification
- revision request
- final approval

All email logs must be stored.

---

# Design Principles

Modern SaaS first.

Subtle pixel-art second.

Prioritize:
- readability
- compact workflows
- operational efficiency
- information hierarchy
