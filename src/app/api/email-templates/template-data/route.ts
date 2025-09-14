import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { zendeskService } from "@/lib/zendesk-service"
import { isZendeskConfigured } from "@/lib/zendesk-config"

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get current date information
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    // Get issues data
    const [
      allIssues,
      openIssues,
      inProgressIssues,
      resolvedThisWeek,
      highPriorityIssues,
      recentlyCreated,
      categories
    ] = await Promise.all([
      // All issues
      prisma.issue.findMany({
        include: {
          category: true,
          notes: true,
          additionalHelpNotes: true
        }
      }),
      
      // Open issues
      prisma.issue.findMany({
        where: { status: "OPEN" },
        include: { category: true }
      }),
      
      // In progress issues
      prisma.issue.findMany({
        where: { status: "IN_PROGRESS" },
        include: { category: true }
      }),
      
      // Resolved this week
      prisma.issue.findMany({
        where: {
          status: "RESOLVED",
          updatedAt: {
            gte: startOfWeek,
            lte: endOfWeek
          }
        },
        include: { category: true }
      }),
      
      // High priority issues
      prisma.issue.findMany({
        where: {
          priority: { in: ["HIGH", "URGENT"] },
          status: { not: "CLOSED" }
        },
        include: { category: true }
      }),
      
      // Recently created (this week)
      prisma.issue.findMany({
        where: {
          createdAt: {
            gte: startOfWeek,
            lte: endOfWeek
          }
        },
        include: { category: true }
      }),
      
      // Categories with issue counts
      prisma.category.findMany({
        include: {
          _count: {
            select: { issues: true }
          }
        }
      })
    ])

    // Get meeting data
    const [activeMeetings, recentMeetings] = await Promise.all([
      prisma.meeting.findMany({
        where: { status: "ACTIVE" },
        include: {
          meetingItems: {
            include: { issue: true }
          }
        }
      }),
      
      prisma.meeting.findMany({
        where: {
          meetingDate: {
            gte: startOfWeek,
            lte: endOfWeek
          }
        },
        include: {
          meetingItems: {
            include: { issue: true }
          }
        },
        orderBy: { meetingDate: "desc" }
      })
    ])

    // Get Zendesk data if configured
    let zendeskData = null
    if (isZendeskConfigured()) {
      try {
        const [zendeskStats, zendeskTickets, zendeskHighPriority] = await Promise.all([
          zendeskService.getTicketStats(),
          zendeskService.getRecentTickets(7),
          zendeskService.getHighPriorityTickets()
        ])
        
        zendeskData = {
          stats: zendeskStats,
          recentTickets: zendeskTickets.map(ticket => ({
            id: ticket.id,
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority,
            created_at: new Date(ticket.created_at).toLocaleDateString(),
            updated_at: new Date(ticket.updated_at).toLocaleDateString()
          })),
          highPriorityTickets: zendeskHighPriority.map(ticket => ({
            id: ticket.id,
            subject: ticket.subject,
            priority: ticket.priority,
            status: ticket.status,
            created_at: new Date(ticket.created_at).toLocaleDateString()
          }))
        }
      } catch (error) {
        console.warn('Failed to fetch Zendesk data:', error)
        zendeskData = {
          stats: { total: 0, open: 0, pending: 0, solved: 0, closed: 0, new: 0, high_priority: 0, urgent_priority: 0 },
          recentTickets: [],
          highPriorityTickets: []
        }
      }
    }

    // Calculate statistics
    const stats = {
      total: allIssues.length,
      open: openIssues.length,
      inProgress: inProgressIssues.length,
      resolved: allIssues.filter(issue => issue.status === "RESOLVED").length,
      closed: allIssues.filter(issue => issue.status === "CLOSED").length,
      resolvedThisWeek: resolvedThisWeek.length,
      newThisWeek: recentlyCreated.length,
      highPriority: highPriorityIssues.length
    }

    // Format data for template variables
    const templateData = {
      // Date information
      currentDate: now.toLocaleDateString(),
      currentWeek: `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`,
      
      // Statistics
      stats,
      
      // Issue lists
      openIssues: openIssues.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        category: issue.category?.name || "Uncategorized",
        assignedTo: issue.assignedTo,
        createdAt: issue.createdAt.toLocaleDateString()
      })),
      
      inProgressIssues: inProgressIssues.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        category: issue.category?.name || "Uncategorized",
        assignedTo: issue.assignedTo,
        workPerformed: issue.workPerformed
      })),
      
      resolvedThisWeek: resolvedThisWeek.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        category: issue.category?.name || "Uncategorized",
        resolvedAt: issue.updatedAt.toLocaleDateString()
      })),
      
      highPriorityIssues: highPriorityIssues.map(issue => ({
        id: issue.id,
        title: issue.title,
        priority: issue.priority,
        category: issue.category?.name || "Uncategorized",
        status: issue.status
      })),
      
      // Category breakdown
      categoryBreakdown: categories.map(category => ({
        name: category.name,
        count: category._count.issues,
        color: category.color
      })),
      
      // Meeting information
      activeMeetings: activeMeetings.map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        itemCount: meeting.meetingItems.length,
        startedAt: meeting.startedAt?.toLocaleDateString()
      })),
      
      recentMeetings: recentMeetings.map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        meetingDate: meeting.meetingDate.toLocaleDateString(),
        status: meeting.status,
        itemCount: meeting.meetingItems.length
      })),
      
      // Zendesk integration data
      zendesk: zendeskData
    }

    return NextResponse.json(templateData)
  } catch (error) {
    console.error("Error fetching template data:", error)
    return NextResponse.json(
      { error: "Failed to fetch template data" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}