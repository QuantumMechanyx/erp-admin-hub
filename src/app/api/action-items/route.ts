import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { issueId, title, description, priority, dueDate } = await request.json()

    if (!issueId || !title) {
      return NextResponse.json({
        success: false,
        error: 'issueId and title are required'
      }, { status: 400 })
    }

    const actionItem = await db.actionItem.create({
      data: {
        issueId,
        title,
        description,
        priority: priority || 0,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    })

    return NextResponse.json({
      success: true,
      actionItem
    })

  } catch (error) {
    console.error('Error creating action item:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create action item'
    }, { status: 500 })
  }
}