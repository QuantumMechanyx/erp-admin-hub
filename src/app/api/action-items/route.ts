import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Fetch individual action items
    const actionItems = await db.actionItem.findMany({
      include: {
        issue: {
          select: {
            id: true,
            title: true,
            description: true,
            category: {
              select: {
                name: true,
                color: true
              }
            }
          }
        },
        originalIssue: {
          select: {
            id: true,
            title: true,
            description: true,
            category: {
              select: {
                name: true,
                color: true
              }
            }
          }
        }
      },
      orderBy: [
        { completed: 'asc' },
        { order: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Fetch issues with rich text action items
    const issuesWithActionItems = await db.issue.findMany({
      where: {
        actionItemsText: {
          not: null
        },
        NOT: {
          actionItemsText: ''
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        actionItemsText: true,
        priority: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            name: true,
            color: true
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' }
      ]
    })

    return NextResponse.json({
      actionItems,
      issuesWithActionItems
    })
  } catch (error) {
    console.error('Error fetching action items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch action items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 POST action item request received')
    const requestBody = await request.json()
    const { issueId, title, description, priority, dueDate } = requestBody
    
    console.log('📋 Request body:', {
      issueId,
      title,
      description,
      priority,
      dueDate,
      fullBody: requestBody
    })

    if (!title) {
      console.log('❌ Missing title in request')
      return NextResponse.json({
        success: false,
        error: 'title is required'
      }, { status: 400 })
    }

    // Get the highest order number and add 1 for the new item
    const maxOrderResult = await db.actionItem.aggregate({
      _max: {
        order: true
      }
    })
    const nextOrder = (maxOrderResult._max.order || 0) + 1

    const createData = {
      issueId: issueId || null,
      originalIssueId: issueId || null,
      title,
      description,
      priority: priority || 0,
      dueDate: dueDate ? new Date(dueDate) : null,
      order: nextOrder
    }
    
    console.log('💾 Creating action item with data:', createData)

    const actionItem = await db.actionItem.create({
      data: createData,
      include: {
        issue: {
          select: {
            id: true,
            title: true,
            description: true,
            category: {
              select: {
                name: true,
                color: true
              }
            }
          }
        }
      }
    })

    console.log('✅ Action item created successfully:', actionItem.id)
    return NextResponse.json(actionItem, { status: 201 })

  } catch (error) {
    console.error('❌ Error creating action item:', error)
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : undefined)
    return NextResponse.json({
      success: false,
      error: 'Failed to create action item'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔧 PUT action items reorder request received')
    const { reorderedItems } = await request.json()

    console.log('📋 Reordered items:', reorderedItems)

    if (!Array.isArray(reorderedItems)) {
      return NextResponse.json({
        success: false,
        error: 'reorderedItems must be an array'
      }, { status: 400 })
    }

    // Update order for each item
    const updatePromises = reorderedItems.map((item: { id: string, order: number }) =>
      db.actionItem.update({
        where: { id: item.id },
        data: { order: item.order }
      })
    )

    await Promise.all(updatePromises)

    console.log('✅ Action items reordered successfully')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Error reordering action items:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to reorder action items'
    }, { status: 500 })
  }
}