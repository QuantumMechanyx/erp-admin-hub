# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ERP Admin Hub - A Next.js application for managing ERP integration issues with four main interfaces:
- **Dashboard** (`/dashboard`) - Issue management and tracking
- **Meetings** (`/meetings`) - Meeting planning and note-taking
- **Emails** (`/emails`) - Weekly stakeholder communications
- **Action Items** (`/action-items`) - Task management with drag-and-drop reordering

## Technology Stack

- **Framework**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui components
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: Azure AD with MSAL
- **Rich Text**: Tiptap editor for action items
- **Drag & Drop**: @dnd-kit for action item reordering
- **Deployment**: Configured for Vercel

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (port 3000)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Database operations
npx prisma generate          # Generate Prisma client
npx prisma migrate dev        # Run migrations
npx prisma migrate reset      # Reset database
npx prisma migrate deploy     # Deploy migrations to production
```

## Database Setup

The project uses Neon PostgreSQL. To set up:
1. Copy `.env.example` to `.env.local`
2. Configure DATABASE_URL with your Neon connection string
3. Run `npx prisma generate` to generate the Prisma client
4. Run `npx prisma migrate dev` to apply migrations

## Code Architecture

### Data Models (Prisma Schema)
- **Issue** - Central entity with rich metadata (priority, status, category, ticket tracking)
- **ActionItem** - Tasks with priority levels, due dates, drag-and-drop ordering
- **Meeting** - Meeting records with status tracking (PLANNED, ACTIVE, COMPLETED)
- **MeetingItem** - Links issues to meetings with discussion notes
- **EmailDraft** - Email templates and drafts linked to issues
- **Note/CmicNote/AdditionalHelpNote** - Various note types attached to issues
- **Category** - Issue categorization with colors
- **ZendeskTicket** - Integration with Zendesk support system

### Server Actions Pattern
All data mutations go through server actions in `/src/lib/actions.ts`:
- Input validation with Zod schemas
- Direct Prisma database operations
- `revalidatePath()` for cache invalidation
- Return format: `{ success: boolean, error?: string }`

### Component Organization
- **Server Components**: Page-level components for data fetching
- **Client Components**: Interactive UI (forms, drag-and-drop, modals)
- **"use client"** directive for client-side interactivity
- Real-time updates via `window.location.reload()` after mutations

### Key UI Patterns
- **Drag & Drop**: @dnd-kit with DragOverlay for smooth reordering
- **Rich Text**: Tiptap editor with bullet list support in action items
- **Forms**: Controlled components with server action submission
- **Modals**: Dialog components for create/edit operations
- **Status Badges**: Visual indicators for priority and status

### Important Configuration Notes
- ESLint and TypeScript errors are ignored during builds (`next.config.js`)
- Prisma client included in `serverExternalPackages`
- Authentication bypass available via environment variables for testing
- Port 3000 is the default development port