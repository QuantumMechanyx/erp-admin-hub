import { NextRequest, NextResponse } from 'next/server'
import { zendeskConfig } from '@/lib/zendesk-config'

interface ZendeskUser {
  id: number
  name: string
  email: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const searchQuery = searchParams.get('search') || ''
    const accessToken = searchParams.get('token') || process.env.ZENDESK_OAUTH_ACCESS_TOKEN

    if (!accessToken) {
      // If no token, return empty results with helpful message
      return NextResponse.json({
        tickets: [],
        count: 0,
        message: 'Zendesk access token not provided. Pass ?token=your_token or configure ZENDESK_OAUTH_ACCESS_TOKEN.'
      })
    }

    const { subdomain } = zendeskConfig
    if (!subdomain) {
      return NextResponse.json({
        tickets: [],
        count: 0,
        message: 'Zendesk subdomain not configured.'
      })
    }

    // Build search query - search in subject and description
    const zendeskQuery = searchQuery
      ? `type:ticket "${searchQuery}"`
      : 'type:ticket status<solved'

    // Construct the Zendesk API URL
    const url = `https://${subdomain}.zendesk.com/api/v2/search.json?query=${encodeURIComponent(zendeskQuery)}&sort_by=updated_at&sort_order=desc&per_page=50`

    console.log('Fetching from Zendesk:', url)

    // Make the API request to Zendesk using Bearer token
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Zendesk API error:', response.status, errorText)

      return NextResponse.json({
        tickets: [],
        count: 0,
        message: `Unable to search Zendesk tickets. Please check your authentication.`
      })
    }

    const data = await response.json()

    // Handle both search results and direct tickets endpoint
    const tickets = data.results || data.tickets || []

    // Get requester details for tickets
    const requesterIds = [...new Set(tickets.map((t: any) => t.requester_id).filter(Boolean))]
    const requestersMap = new Map<number, ZendeskUser>()

    if (requesterIds.length > 0) {
      try {
        const usersUrl = `https://${subdomain}.zendesk.com/api/v2/users/show_many.json?ids=${requesterIds.join(',')}`
        const usersResponse = await fetch(usersUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (usersResponse.ok) {
          const usersData: { users: ZendeskUser[] } = await usersResponse.json()
          usersData.users.forEach(user => {
            requestersMap.set(user.id, user)
          })
        }
      } catch (error) {
        console.warn('Failed to fetch user details:', error)
      }
    }

    // Transform Zendesk tickets to our format
    const transformedTickets = tickets.map((ticket: any) => {
      const requester = ticket.requester_id ? requestersMap.get(ticket.requester_id) : null

      return {
        ticketId: ticket.id,
        subject: ticket.subject || 'No subject',
        description: ticket.description || '',
        status: mapZendeskStatus(ticket.status),
        priority: mapZendeskPriority(ticket.priority || 'normal'),
        requester: requester ? {
          name: requester.name || 'Unknown',
          email: requester.email || ''
        } : null,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at
      }
    })

    return NextResponse.json({
      tickets: transformedTickets,
      count: transformedTickets.length,
      message: searchQuery ? `Found ${transformedTickets.length} tickets matching "${searchQuery}"` : `Showing ${transformedTickets.length} recent tickets`
    })
  } catch (error) {
    console.error('Error searching Zendesk tickets:', error)

    // Return empty results instead of error to prevent UI breaking
    return NextResponse.json({
      tickets: [],
      count: 0,
      message: 'Unable to connect to Zendesk. Please try again later.'
    })
  }
}

// Helper function to map Zendesk status to our format
function mapZendeskStatus(status: string): string {
  switch (status?.toLowerCase()) {
    case 'new': return 'NEW'
    case 'open': return 'OPEN'
    case 'pending': return 'PENDING'
    case 'hold': return 'HOLD'
    case 'solved': return 'SOLVED'
    case 'closed': return 'CLOSED'
    default: return 'OPEN'
  }
}

// Helper function to map Zendesk priority to our format
function mapZendeskPriority(priority: string): string {
  switch (priority?.toLowerCase()) {
    case 'low': return 'LOW'
    case 'normal': return 'NORMAL'
    case 'high': return 'HIGH'
    case 'urgent': return 'URGENT'
    default: return 'NORMAL'
  }
}