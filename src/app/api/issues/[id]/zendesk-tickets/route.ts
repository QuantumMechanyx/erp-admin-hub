import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/issues/[id]/zendesk-tickets - Get linked tickets for an issue
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: issueId } = await params

    const linkedTickets = await db.zendeskTicket.findMany({
      where: {
        linkedIssueId: issueId
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      tickets: linkedTickets
    })

  } catch (error) {
    console.error('Error fetching linked tickets:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch linked tickets'
    }, { status: 500 })
  }
}

// POST /api/issues/[id]/zendesk-tickets - Link a Zendesk ticket to an issue
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: issueId } = await params
    const { zendeskTicketId, ticketData } = await request.json()

    if (!zendeskTicketId) {
      return NextResponse.json({
        success: false,
        error: 'zendeskTicketId is required'
      }, { status: 400 })
    }

    // Check if the issue exists
    const issue = await db.issue.findUnique({
      where: { id: issueId }
    })

    if (!issue) {
      return NextResponse.json({
        success: false,
        error: 'Issue not found'
      }, { status: 404 })
    }

    // Check if ticket already exists in our database
    let zendeskTicket = await db.zendeskTicket.findUnique({
      where: { zendeskId: zendeskTicketId }
    })

    if (zendeskTicket) {
      // Update existing ticket to link to this issue
      zendeskTicket = await db.zendeskTicket.update({
        where: { zendeskId: zendeskTicketId },
        data: {
          linkedIssueId: issueId,
          isERPRelated: true,
          lastSyncedAt: new Date()
        }
      })
    } else if (ticketData) {
      // Create new ticket record and link to issue
      zendeskTicket = await db.zendeskTicket.create({
        data: {
          zendeskId: zendeskTicketId,
          subject: ticketData.subject,
          description: ticketData.description,
          status: mapZendeskStatus(ticketData.status),
          priority: mapZendeskPriority(ticketData.priority),
          ticketType: mapZendeskType(ticketData.type || 'INCIDENT'),
          requesterEmail: ticketData.requester?.email,
          assigneeEmail: ticketData.assignee?.email,
          createdAt: new Date(ticketData.createdAt),
          updatedAt: new Date(ticketData.updatedAt),
          linkedIssueId: issueId,
          isERPRelated: true,
          lastSyncedAt: new Date()
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Ticket not found in database and no ticketData provided'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      ticket: zendeskTicket,
      message: `Ticket #${zendeskTicketId} linked to issue successfully`
    })

  } catch (error) {
    console.error('Error linking ticket to issue:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to link ticket to issue'
    }, { status: 500 })
  }
}

// DELETE /api/issues/[id]/zendesk-tickets/[ticketId] - Unlink a ticket from an issue
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: issueId } = await params
    const { searchParams } = new URL(request.url)
    const zendeskTicketId = searchParams.get('ticketId')

    if (!zendeskTicketId) {
      return NextResponse.json({
        success: false,
        error: 'ticketId parameter is required'
      }, { status: 400 })
    }

    const updatedTicket = await db.zendeskTicket.updateMany({
      where: {
        zendeskId: parseInt(zendeskTicketId),
        linkedIssueId: issueId
      },
      data: {
        linkedIssueId: null,
        isERPRelated: false,
        lastSyncedAt: new Date()
      }
    })

    if (updatedTicket.count === 0) {
      return NextResponse.json({
        success: false,
        error: 'Ticket link not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Ticket #${zendeskTicketId} unlinked from issue successfully`
    })

  } catch (error) {
    console.error('Error unlinking ticket from issue:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to unlink ticket from issue'
    }, { status: 500 })
  }
}

// Helper functions to map Zendesk values to our enum types
function mapZendeskStatus(status: string) {
  switch (status.toLowerCase()) {
    case 'new': return 'NEW'
    case 'open': return 'OPEN'
    case 'pending': return 'PENDING'
    case 'hold': return 'HOLD'
    case 'solved': return 'SOLVED'
    case 'closed': return 'CLOSED'
    default: return 'OPEN'
  }
}

function mapZendeskPriority(priority: string) {
  switch (priority.toLowerCase()) {
    case 'low': return 'LOW'
    case 'normal': return 'NORMAL'
    case 'high': return 'HIGH'
    case 'urgent': return 'URGENT'
    default: return 'NORMAL'
  }
}

function mapZendeskType(type: string) {
  switch (type.toLowerCase()) {
    case 'problem': return 'PROBLEM'
    case 'incident': return 'INCIDENT'
    case 'question': return 'QUESTION'
    case 'task': return 'TASK'
    default: return 'INCIDENT'
  }
}