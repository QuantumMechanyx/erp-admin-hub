import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { completed, title, description, priority, dueDate } = await request.json()

    const updateData: any = {}
    
    if (completed !== undefined) updateData.completed = completed
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null

    const actionItem = await db.actionItem.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      actionItem
    })

  } catch (error) {
    console.error('Error updating action item:', error)
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