# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ERP Admin Hub - A Next.js application for managing ERP integration issues with three main interfaces:
- **Working Interface** (`/dashboard`) - Issue management and tracking
- **Meeting Interface** (`/meetings`) - Meeting planning and note-taking
- **Email Drafting Interface** (`/emails`) - Weekly stakeholder communications

## Technology Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui components
- **Database**: Neon PostgreSQL with Prisma ORM
- **Deployment**: Configured for Vercel

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Generate Prisma client
npx prisma generate

# Run database migrations (when DATABASE_URL is configured)
npx prisma migrate dev

# Reset database (when DATABASE_URL is configured)
npx prisma migrate reset
```

## Database Setup

1. Create a Neon PostgreSQL database
2. Update `.env.local` with your DATABASE_URL
3. Run `npx prisma migrate dev` to apply schema
4. Run `npx prisma generate` to generate Prisma client

## Project Structure

- `/src/app` - Next.js App Router pages and layouts
- `/src/components` - React components (including shadcn/ui components)
- `/src/lib` - Utility functions and database connection
- `/prisma` - Database schema and migrations

## Database Schema

Core models:
- **Issue** - Main entity with title, description, priority, status
- **Note** - Notes attached to issues
- **Meeting** - Meeting records with agenda and minutes
- **MeetingItem** - Links issues to meetings
- **EmailDraft** - Email drafts and templates
- **EmailIssue** - Links issues to email drafts

## Key Features

- Issues flow between all three interfaces
- Real-time updates using Server Actions
- Type-safe database operations with Prisma
- Responsive design with Tailwind CSS