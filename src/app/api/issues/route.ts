import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const whereClause: any = {
      archived: false
    }

    if (status === 'resolved') {
      whereClause.status = {
        in: ['RESOLVED', 'CLOSED']
      }
    } else {
      whereClause.status = {
        in: ['OPEN', 'IN_PROGRESS']
      }
    }

    const issues = await db.issue.findMany({
      where: whereClause,
      include: {
        category: true,
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { notes: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' },
      ],
    })

    return NextResponse.json(issues)
  } catch (error) {
    console.error('Error fetching issues:', error)
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.title) {
      return NextResponse.json({
        success: false,
        error: 'Title is required'
      }, { status: 400 })
    }

    // Map the incoming data to match the database schema
    const issueData = {
      title: data.title,
      description: data.description || null,
      resolutionPlan: data.resolutionPlan || null,
      workPerformed: data.workPerformed || null,
      workOrganization: data.workOrganization || null,
      roadblocks: data.roadblocks || null,
      usersInvolved: data.usersInvolved || null,
      additionalHelp: data.additionalHelp || null,
      priority: data.priority || 'MEDIUM',
      status: data.status || 'OPEN',
      categoryId: data.categoryId || null,
      assignedTo: data.assignedTo || null,
      cmicTicketNumber: data.cmicTicketNumber || null,
      cmicTicketOpened: data.cmicTicketOpened ? new Date(data.cmicTicketOpened) : null,
      cmicTicketClosed: data.cmicTicketClosed || false,
    }

    const issue = await db.issue.create({
      data: issueData,
    })

    // If there are additional notes (like from Zendesk import), create a note
    if (data.additionalNotes) {
      await db.note.create({
        data: {
          issueId: issue.id,
          content: data.additionalNotes,
          author: 'System - Zendesk Import'
        }
      })
    }

    revalidatePath('/dashboard')
    
    return NextResponse.json({
      success: true,
      issue,
      id: issue.id
    })

  } catch (error) {
    console.error('Error creating issue:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create issue'
    }, { status: 500 })
  }
}