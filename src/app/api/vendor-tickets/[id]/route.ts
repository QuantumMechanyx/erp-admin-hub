import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateVendorTicketSchema = z.object({
  ticketNumber: z.string().min(1).optional(),
  vendor: z.enum(["CMIC", "PROCORE", "OTHER"]).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  description: z.string().optional(),
  dateOpened: z.string().optional(),
  dateClosed: z.string().nullable().optional(),
  notes: z.string().optional()
})

// GET /api/vendor-tickets/[id] - Get a single vendor ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const vendorTicket = await db.vendorTicket.findUnique({
      where: { id },
      include: {
        issue: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!vendorTicket) {
      return NextResponse.json({
        success: false,
        error: 'Vendor ticket not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      ticket: vendorTicket
    })

  } catch (error) {
    console.error('Error fetching vendor ticket:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch vendor ticket'
    }, { status: 500 })
  }
}

// PATCH /api/vendor-tickets/[id] - Update a vendor ticket
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateVendorTicketSchema.parse(body)

    // Check if ticket exists
    const existingTicket = await db.vendorTicket.findUnique({
      where: { id }
    })

    if (!existingTicket) {
      return NextResponse.json({
        success: false,
        error: 'Vendor ticket not found'
      }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date()
    }

    // Handle date fields
    if (validatedData.dateOpened) {
      updateData.dateOpened = new Date(validatedData.dateOpened)
    }
    if (validatedData.dateClosed !== undefined) {
      updateData.dateClosed = validatedData.dateClosed ? new Date(validatedData.dateClosed) : null
    }

    // Update ticket
    const updatedTicket = await db.vendorTicket.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: 'Vendor ticket updated successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    console.error('Error updating vendor ticket:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update vendor ticket'
    }, { status: 500 })
  }
}

// DELETE /api/vendor-tickets/[id] - Delete a vendor ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if ticket exists
    const existingTicket = await db.vendorTicket.findUnique({
      where: { id }
    })

    if (!existingTicket) {
      return NextResponse.json({
        success: false,
        error: 'Vendor ticket not found'
      }, { status: 404 })
    }

    // Delete ticket
    await db.vendorTicket.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: `${existingTicket.vendor} ticket #${existingTicket.ticketNumber} deleted successfully`
    })

  } catch (error) {
    console.error('Error deleting vendor ticket:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete vendor ticket'
    }, { status: 500 })
  }
}