import { NextRequest, NextResponse } from "next/server"
import { getOpenAIClient, isOpenAIEnabled } from "@/lib/openai-config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    if (!isOpenAIEnabled()) {
      return NextResponse.json(
        { error: "AI features are disabled. OpenAI API key not configured." },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { message, conversation = [], action = "chat" } = body

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    const openai = getOpenAIClient()
    if (!openai) {
      return NextResponse.json(
        { error: "Failed to initialize OpenAI client" },
        { status: 500 }
      )
    }

    // Gather current ERP context
    const context = await gatherERPContext()

    const systemPrompt = `You are an ERP Email Assistant helping users write professional emails for the core team. 

CURRENT ERP SYSTEM CONTEXT:
${formatERPContext(context)}

IMPORTANT GUIDELINES:
- The audience is always the core team: Rebecca Freeman, Lisa Terlson, Sarah Pham, Lorrie Langlois, Matt Jaworski, and optionally Rachel Diel
- NEVER use the word "stakeholders" in any emails - refer to them as "team members", "core team", or "leadership team"
- Always ask if meeting discussion notes should be included, and if so, integrate them smoothly into the email flow
- Default to a professional but approachable tone unless specified otherwise

Your role:
- Help users draft emails about ERP status, issues, and updates
- Ask clarifying questions to understand what they want to communicate
- Suggest relevant information to include based on current ERP data
- Generate email drafts when requested
- Be conversational but professional
- Focus on the most important and recent information

When users ask for help writing weekly summary emails:
1. Understand their specific intent and focus areas
2. Ask about tone preference (formal, casual, informative)
3. Ask if meeting discussion notes should be included
4. Ask about any specific points to highlight beyond current issues and meetings
5. Suggest relevant current data to include
6. Generate drafts when they're ready

Keep responses concise and actionable.`

    // Build conversation history
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversation.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ]

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    })

    const assistantReply = response.choices[0]?.message?.content

    if (!assistantReply) {
      return NextResponse.json(
        { error: "No response generated from AI" },
        { status: 500 }
      )
    }

    // Update conversation history
    const updatedConversation = [
      ...conversation,
      { role: "user", content: message },
      { role: "assistant", content: assistantReply }
    ]

    return NextResponse.json({
      message: assistantReply,
      conversation: updatedConversation,
      context: context,
      usage: response.usage
    })

  } catch (error) {
    console.error("AI chat error:", error)
    
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "Invalid OpenAI API key" },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: `AI chat failed: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Unknown error occurred during AI chat" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

async function gatherERPContext() {
  try {
    // Get current date info
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })

    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    
    const currentWeek = `${startOfWeek.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}`

    // Get all issues
    const allIssues = await prisma.issue.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: true
      }
    })

    // Calculate stats
    const stats = {
      total: allIssues.length,
      open: allIssues.filter(i => i.status === 'OPEN').length,
      inProgress: allIssues.filter(i => i.status === 'IN_PROGRESS').length,
      resolved: allIssues.filter(i => i.status === 'RESOLVED').length,
      closed: allIssues.filter(i => i.status === 'CLOSED').length,
      highPriority: allIssues.filter(i => i.priority === 'HIGH').length
    }

    // Get recent activity (this week)
    const weekStart = new Date(startOfWeek)
    const thisWeekIssues = allIssues.filter(issue => 
      new Date(issue.createdAt) >= weekStart
    )

    const resolvedThisWeek = allIssues.filter(issue => 
      issue.status === 'RESOLVED' && 
      issue.updatedAt && 
      new Date(issue.updatedAt) >= weekStart
    )

    // Get recent meetings
    const recentMeetings = await prisma.meeting.findMany({
      take: 5,
      orderBy: { meetingDate: 'desc' },
      include: {
        meetingItems: {
          include: {
            issue: true
          }
        }
      }
    })

    // Get issues by status
    const openIssues = allIssues.filter(i => i.status === 'OPEN')
    const inProgressIssues = allIssues.filter(i => i.status === 'IN_PROGRESS')
    const highPriorityIssues = allIssues.filter(i => i.priority === 'HIGH')

    return {
      currentDate,
      currentWeek,
      stats,
      thisWeekIssues,
      resolvedThisWeek,
      openIssues,
      inProgressIssues,
      highPriorityIssues,
      recentMeetings,
      allIssues
    }

  } catch (error) {
    console.error('Error gathering ERP context:', error)
    return null
  }
}

function formatERPContext(context: any) {
  if (!context) return "Unable to load current ERP data."

  return `
CURRENT DATE: ${context.currentDate}
CURRENT WEEK: ${context.currentWeek}

ISSUE STATISTICS:
- Total Issues: ${context.stats.total}
- Open: ${context.stats.open}
- In Progress: ${context.stats.inProgress} 
- Resolved: ${context.stats.resolved}
- High Priority: ${context.stats.highPriority}

NEW ISSUES THIS WEEK: ${context.thisWeekIssues.length}
RESOLVED THIS WEEK: ${context.resolvedThisWeek.length}

CURRENT OPEN ISSUES:
${context.openIssues.map((issue: any) => 
  `- ${issue.title} (${issue.priority}) - Created: ${new Date(issue.createdAt).toLocaleDateString()}`
).join('\n') || 'None'}

CURRENT IN-PROGRESS ISSUES:  
${context.inProgressIssues.map((issue: any) => 
  `- ${issue.title} (${issue.priority}) - Assigned: ${issue.assignedTo || 'Unassigned'}`
).join('\n') || 'None'}

HIGH PRIORITY ISSUES:
${context.highPriorityIssues.map((issue: any) => 
  `- ${issue.title} (${issue.status}) - ${issue.category}`
).join('\n') || 'None'}

RECENT MEETINGS:
${context.recentMeetings.slice(0, 3).map((meeting: any) => 
  `- ${meeting.title} on ${new Date(meeting.meetingDate).toLocaleDateString()} (${meeting.meetingItems.length} items discussed)`
).join('\n') || 'None'}

Use this information to help users write informed emails about the ERP system status.
`
}