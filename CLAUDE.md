# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ERP Admin Hub - A Next.js application for managing ERP integration issues with four main interfaces:
- **Working Interface** (`/dashboard`) - Issue management and tracking
- **Meeting Interface** (`/meetings`) - Meeting planning and note-taking
- **Email Drafting Interface** (`/emails`) - Weekly stakeholder communications
- **Action Items Interface** (`/action-items`) - Task management with drag-and-drop

## Technology Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui components
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: Azure AD with MSAL
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
```

## Database Setup

The project uses Neon PostgreSQL. To set up:
1. Configure DATABASE_URL in `.env.local` (see `.env.example`)
2. Run `npx prisma generate` to generate the Prisma client
3. Run `npx prisma migrate dev` to apply migrations

## Architecture

### Core Entities
- **Issue** - Central entity with fields: title, description, priority, status, category, CMIC ticket info
- **ActionItem** - Tasks linked to issues with priority and due dates
- **Meeting** - Meeting records with agenda/minutes
- **EmailDraft** - Email templates and drafts
- **Note** - Notes attached to issues

### Key Patterns
- **Server Actions** in `/src/lib/actions.ts` for data mutations
- **Server Components** for data fetching in page components
- **Client Components** for interactive features (drag-and-drop, forms)
- **Zod schemas** for input validation
- **Real-time updates** using `revalidatePath` and `window.location.reload()`

### Important Configuration
- ESLint and TypeScript errors are ignored during builds (see `next.config.js`)
- Prisma client is included in `serverExternalPackages`
- Authentication can be bypassed for testing using BYPASS_USERNAME_HASH and BYPASS_PASSWORD_HASH environment variables