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

    const createData = {
      issueId: issueId || null,
      originalIssueId: issueId || null,
      title,
      description,
      priority: priority || 0,
      dueDate: dueDate ? new Date(dueDate) : null
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