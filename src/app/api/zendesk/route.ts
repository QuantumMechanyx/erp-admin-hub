import { NextRequest, NextResponse } from 'next/server'
import { zendeskService } from '@/lib/zendesk-service'
import { isZendeskConfigured } from '@/lib/zendesk-config'

export async function GET(request: NextRequest) {
  try {
    // Check if Zendesk is properly configured
    if (!isZendeskConfigured()) {
      return NextResponse.json({ 
        error: 'Zendesk integration is not configured. Please set ZENDESK_SUBDOMAIN and ZENDESK_API_TOKEN environment variables.' 
      }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'test':
        const connectionTest = await zendeskService.testConnection()
        return NextResponse.json(connectionTest)

      case 'stats':
        const stats = await zendeskService.getTicketStats()
        return NextResponse.json(stats)

      case 'tickets':
        const status = searchParams.get('status')?.split(',')
        const priority = searchParams.get('priority')?.split(',')
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
        const recent = searchParams.get('recent') ? parseInt(searchParams.get('recent')!) : undefined
        const highPriority = searchParams.get('high_priority') === 'true'
        const erpOnly = searchParams.get('erp_only') === 'true'

        let tickets

        if (recent) {
          tickets = await zendeskService.getRecentTickets(recent)
        } else if (highPriority) {
          tickets = await zendeskService.getHighPriorityTickets()
        } else if (erpOnly) {
          tickets = await zendeskService.getERPSupportTickets()
        } else {
          tickets = await zendeskService.getTickets({
            status,
            priority,
            limit,
            sort_by: 'updated_at',
            sort_order: 'desc'
          })
        }

        return NextResponse.json({ tickets })

      case 'search':
        const query = searchParams.get('query')
        if (!query) {
          return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
        }
        const searchResults = await zendeskService.searchTickets(query)
        return NextResponse.json({ tickets: searchResults })

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Supported actions: test, stats, tickets, search' 
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Zendesk API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch Zendesk data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isZendeskConfigured()) {
      return NextResponse.json({ 
        error: 'Zendesk integration is not configured' 
      }, { status: 503 })
    }

    const { action, ...data } = await request.json()

    switch (action) {
      case 'sync':
        // Sync Zendesk tickets to local database
        // This would be implemented later when needed
        return NextResponse.json({ 
          message: 'Sync functionality not implemented yet',
          action: 'sync'
        })

      case 'link_issue':
        // Link a Zendesk ticket to an ERP issue
        const { ticketId, issueId } = data
        if (!ticketId || !issueId) {
          return NextResponse.json({ 
            error: 'ticketId and issueId are required' 
          }, { status: 400 })
        }
        
        // This would be implemented with database operations
        return NextResponse.json({ 
          message: 'Issue linking functionality not implemented yet',
          ticketId,
          issueId
        })

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Supported actions: sync, link_issue' 
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Zendesk POST API error:', error)
    return NextResponse.json({ 
      error: 'Failed to process Zendesk request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}