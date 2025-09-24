import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createVendorTicketSchema = z.object({
  issueId: z.string(),
  ticketNumber: z.string().min(1, "Ticket number is required"),
  vendor: z.enum(["CMIC", "PROCORE", "OTHER"]),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  description: z.string().optional(),
  dateOpened: z.string().optional(),
  dateClosed: z.string().optional(),
  notes: z.string().optional()
})

// GET /api/vendor-tickets - Get all vendor tickets for an issue
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const issueId = searchParams.get('issueId')

    if (!issueId) {
      return NextResponse.json({
        success: false,
        error: 'issueId parameter is required'
      }, { status: 400 })
    }

    const vendorTickets = await db.vendorTicket.findMany({
      where: { issueId },
      orderBy: [
        { vendor: 'asc' },
        { dateOpened: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      tickets: vendorTickets
    })

  } catch (error) {
    console.error('Error fetching vendor tickets:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch vendor tickets'
    }, { status: 500 })
  }
}

// POST /api/vendor-tickets - Create a new vendor ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createVendorTicketSchema.parse(body)

    // Check if issue exists
    const issue = await db.issue.findUnique({
      where: { id: validatedData.issueId }
    })

    if (!issue) {
      return NextResponse.json({
        success: false,
        error: 'Issue not found'
      }, { status: 404 })
    }

    // Create vendor ticket
    const vendorTicket = await db.vendorTicket.create({
      data: {
        issueId: validatedData.issueId,
        ticketNumber: validatedData.ticketNumber,
        vendor: validatedData.vendor,
        status: validatedData.status || 'OPEN',
        description: validatedData.description,
        dateOpened: validatedData.dateOpened ? new Date(validatedData.dateOpened) : new Date(),
        dateClosed: validatedData.dateClosed ? new Date(validatedData.dateClosed) : null,
        notes: validatedData.notes
      }
    })

    return NextResponse.json({
      success: true,
      ticket: vendorTicket,
      message: `${validatedData.vendor} ticket #${validatedData.ticketNumber} added successfully`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    console.error('Error creating vendor ticket:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create vendor ticket'
    }, { status: 500 })
  }
}