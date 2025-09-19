import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const actionItem = await db.actionItem.findUnique({
      where: { id },
      include: {
        issue: {
          include: {
            category: true
          }
        }
      }
    })

    if (!actionItem) {
      return NextResponse.json(
        { error: 'Action item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(actionItem)
  } catch (error) {
    console.error('Error fetching action item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch action item' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const requestBody = await request.json()
    const { completed, title, description, priority, dueDate, issueId, originalIssueId } = requestBody

    console.log('🔧 PATCH action item request:', {
      id,
      requestBody,
      updateFields: { completed, title, description, priority, dueDate, issueId, originalIssueId }
    })

    const updateData: Record<string, unknown> = {}

    if (completed !== undefined) updateData.completed = completed
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (issueId !== undefined) updateData.issueId = issueId
    if (originalIssueId !== undefined) updateData.originalIssueId = originalIssueId

    console.log('📝 Update data prepared:', updateData)

    try {
      const actionItem = await db.actionItem.update({
        where: { id },
        data: updateData
      })

      console.log('✅ Action item updated successfully:', actionItem)
      return NextResponse.json({
        success: true,
        actionItem
      })
    } catch (dbError) {
      console.error('💥 DATABASE ERROR MESSAGE:', dbError instanceof Error ? dbError.message : String(dbError))
      console.error('💥 ERROR TYPE:', typeof dbError)
      console.error('💥 ERROR CONSTRUCTOR:', dbError?.constructor?.name)
      console.error('💥 ERROR CODE:', (dbError as Record<string, unknown>)?.code)
      console.error('💥 ERROR META:', JSON.stringify((dbError as Record<string, unknown>)?.meta))
      console.error('💥 UPDATE DATA:', JSON.stringify(updateData))
      console.error('💥 FULL ERROR OBJECT:', JSON.stringify(dbError, null, 2))
      throw dbError // Re-throw to be caught by outer catch
    }

  } catch (error) {
    const { id } = await params
    console.error('❌ Error updating action item:', {
      id,
      error: error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({
      success: false,
      error: 'Failed to update action item'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.actionItem.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Action item deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting action item:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete action item'
    }, { status: 500 })
  }
}