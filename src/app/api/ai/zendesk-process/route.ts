import { NextRequest, NextResponse } from "next/server"
import { getOpenAIClient, isOpenAIEnabled } from "@/lib/openai-config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface ZendeskTicket {
  ticketId: number
  subject: string
  description?: string
  status: string
  priority: string
  type: string
  requester: {
    name: string
    email: string
  } | null
  updatedAt: string
  createdAt: string
}

interface ProcessedTicket {
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignedTo: string
  suggestedCategory?: string
  reasoningNotes: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('AI Processing request received')
    
    if (!isOpenAIEnabled()) {
      console.log('OpenAI not enabled, API key missing')
      return NextResponse.json(
        { error: "AI features are disabled. OpenAI API key not configured." },
        { status: 503 }
      )
    }

    console.log('OpenAI is enabled')

    const body = await request.json()
    const { tickets, mode = "single" } = body

    console.log('Processing tickets:', Array.isArray(tickets) ? tickets.length : 1, 'mode:', mode)

    if (!tickets || (Array.isArray(tickets) && tickets.length === 0)) {
      return NextResponse.json(
        { error: "At least one ticket is required" },
        { status: 400 }
      )
    }

    const openai = getOpenAIClient()
    if (!openai) {
      console.log('Failed to get OpenAI client')
      return NextResponse.json(
        { error: "Failed to initialize OpenAI client" },
        { status: 500 }
      )
    }

    console.log('OpenAI client initialized successfully')

    // Get categories for context
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, description: true }
    })

    // Process tickets (single or batch)
    const ticketsToProcess = Array.isArray(tickets) ? tickets : [tickets]
    const processedTickets: ProcessedTicket[] = []

    for (const ticket of ticketsToProcess) {
      const processed = await processTicketWithAI(openai, ticket, categories)
      processedTickets.push(processed)
    }

    return NextResponse.json({
      success: true,
      processedTickets: mode === "single" ? processedTickets[0] : processedTickets,
      originalCount: ticketsToProcess.length
    })

  } catch (error) {
    console.error("AI Zendesk processing error:", error)
    
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "Invalid OpenAI API key" },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: `AI processing failed: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Unknown error occurred during AI processing" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

async function processTicketWithAI(
  openai: any, 
  ticket: ZendeskTicket, 
  categories: Array<{id: string, name: string, description: string | null}>
): Promise<ProcessedTicket> {
  
  const systemPrompt = `You are an ERP Technical Assistant helping convert Zendesk support tickets into actionable ERP issues for the development team. Your job is to intelligently extract and format ticket information for the ERP Admin Hub.

AVAILABLE CATEGORIES:
${categories.map(cat => `- ${cat.name}: ${cat.description || 'No description'}`).join('\n')}

GUIDELINES FOR PROCESSING TICKETS:

1. TITLE EXTRACTION:
   - Create a clear, concise technical title that captures the core issue
   - Remove ticket formalities, greetings, and conversational elements
   - Focus on the specific ERP integration problem or request
   - Keep titles under 100 characters

2. DESCRIPTION PROCESSING:
   - Extract the core technical issue from email threads and conversations
   - Remove email headers, signatures, greetings, and threading artifacts
   - Summarize the business impact and technical requirements
   - Include relevant error messages or system details
   - Format as clear, actionable problem description
   - If description contains email thread, extract the original issue from the first message

3. PRIORITY MAPPING:
   - LOW: Minor enhancements, non-critical issues
   - MEDIUM: Standard functionality issues, moderate business impact
   - HIGH: Critical functionality broken, significant business impact
   - URGENT: System down, blocking operations, data integrity issues

4. ASSIGNEE DETERMINATION:
   - For ERP admin tickets, suggest "lorrie.langlois@deacon.com" as the primary ERP admin
   - Do NOT assign to the original requester (they are the customer/user reporting the issue)
   - Alternative team members: "ERP Team" if specific assignment is unclear

5. CATEGORY SUGGESTION:
   - Match ticket content to most relevant available category
   - Consider integration type, system component, or issue type
   - Only suggest from the provided categories list

6. REASONING NOTES:
   - Explain key decisions made during processing
   - Note any assumptions or clarifications needed
   - Highlight extracted technical details
   - Mention if information was unclear or missing

RESPONSE FORMAT:
Return a JSON object with these fields:
{
  "title": "clear technical title",
  "description": "processed description without email artifacts",
  "priority": "LOW|MEDIUM|HIGH|URGENT",
  "assignedTo": "email or team name",
  "suggestedCategory": "category name or null",
  "reasoningNotes": "explanation of processing decisions"
}

Be thorough but concise. Focus on creating actionable ERP issues that the development team can work with immediately.`

  const userPrompt = `Process this Zendesk ticket for ERP issue creation:

TICKET #${ticket.ticketId}
Subject: ${ticket.subject}
Status: ${ticket.status}
Priority: ${ticket.priority}
Type: ${ticket.type}
Created: ${ticket.createdAt}
Updated: ${ticket.updatedAt}

Requester: ${ticket.requester?.name || 'Unknown'} (${ticket.requester?.email || 'N/A'})

Description/Content:
${ticket.description || 'No description provided'}

Please process this ticket according to the guidelines and return the formatted JSON response.`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent processing
      max_tokens: 1000,
    })

    const assistantReply = response.choices[0]?.message?.content
    if (!assistantReply) {
      throw new Error("No response generated from AI")
    }

    // Parse the JSON response
    let processedTicket: ProcessedTicket
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = assistantReply.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : assistantReply
      processedTicket = JSON.parse(jsonString)
    } catch (parseError) {
      // Fallback if JSON parsing fails
      console.warn("Failed to parse AI response as JSON:", assistantReply)
      processedTicket = {
        title: ticket.subject || `Zendesk Ticket #${ticket.ticketId}`,
        description: ticket.description || 'No description provided',
        priority: mapZendeskPriority(ticket.priority),
        assignedTo: ticket.requester?.email || 'ERP Team',
        suggestedCategory: undefined,
        reasoningNotes: "AI processing failed - using fallback mapping"
      }
    }

    return processedTicket

  } catch (error) {
    console.error("Error processing ticket with AI:", error)
    // Return fallback processing
    return {
      title: ticket.subject || `Zendesk Ticket #${ticket.ticketId}`,
      description: ticket.description || 'No description provided',
      priority: mapZendeskPriority(ticket.priority),
      assignedTo: ticket.requester?.email || 'ERP Team',
      suggestedCategory: undefined,
      reasoningNotes: `AI processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

function mapZendeskPriority(zendeskPriority: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  switch (zendeskPriority.toLowerCase()) {
    case 'urgent': return 'URGENT'
    case 'high': return 'HIGH'
    case 'normal': return 'MEDIUM'
    case 'low': return 'LOW'
    default: return 'MEDIUM'
  }
}