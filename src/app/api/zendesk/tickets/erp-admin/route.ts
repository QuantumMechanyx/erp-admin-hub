import { NextRequest, NextResponse } from 'next/server'
import { zendeskConfig } from '@/lib/zendesk-config'

interface ZendeskGroup {
  id: number
  name: string
  description?: string
}

interface ZendeskTicket {
  id: number
  subject: string
  description?: string
  status: string
  priority: string
  type: string
  created_at: string
  updated_at: string
  assignee_id?: number
  requester_id?: number
  group_id?: number
}

interface ZendeskUser {
  id: number
  name: string
  email: string
}

interface ZendeskTicketsResponse {
  tickets: ZendeskTicket[]
  next_page?: string
  previous_page?: string
  count: number
}

interface ZendeskSearchResponse {
  results: ZendeskTicket[]
  next_page?: string
  previous_page?: string
  count: number
}

interface ZendeskGroupsResponse {
  groups: ZendeskGroup[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('token')
    const perPage = parseInt(searchParams.get('per_page') || '50') // Default to 50 tickets
    const page = parseInt(searchParams.get('page') || '1')
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Access token is required. Please provide it as a query parameter: ?token=your_token' 
      }, { status: 400 })
    }

    const { subdomain } = zendeskConfig
    if (!subdomain) {
      return NextResponse.json({ 
        error: 'Zendesk subdomain is not configured' 
      }, { status: 500 })
    }

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }

    // Step 1: Find the ERP Admin group ID
    const groupsResponse = await fetch(`https://${subdomain}.zendesk.com/api/v2/groups.json`, {
      headers
    })

    if (!groupsResponse.ok) {
      const errorData = await groupsResponse.text()
      throw new Error(`Failed to fetch groups: ${groupsResponse.status} - ${errorData}`)
    }

    const groupsData: ZendeskGroupsResponse = await groupsResponse.json()
    const erpAdminGroup = groupsData.groups.find(group => 
      group.name.toLowerCase().includes('erp admin') || 
      group.name.toLowerCase().includes('erp_admin') ||
      group.name.toLowerCase() === 'erp admin'
    )

    if (!erpAdminGroup) {
      return NextResponse.json({
        error: 'ERP Admin group not found',
        availableGroups: groupsData.groups.map(g => ({ id: g.id, name: g.name }))
      }, { status: 404 })
    }

    // Step 2: Get tickets for the ERP Admin group using search API (sorted by updated_at desc)
    const ticketsUrl = `https://${subdomain}.zendesk.com/api/v2/search.json?query=type:ticket group_id:${erpAdminGroup.id}&sort_by=updated_at&sort_order=desc&per_page=${perPage}&page=${page}`
    
    const ticketsResponse = await fetch(ticketsUrl, {
      headers
    })

    if (!ticketsResponse.ok) {
      const errorData = await ticketsResponse.text()
      throw new Error(`Failed to fetch tickets: ${ticketsResponse.status} - ${errorData}`)
    }

    const ticketsData: ZendeskSearchResponse = await ticketsResponse.json()

    // Step 3: Get requester details for each ticket
    const requesterIds = [...new Set(ticketsData.results.map(ticket => ticket.requester_id).filter(Boolean))]
    const requestersMap = new Map<number, ZendeskUser>()

    if (requesterIds.length > 0) {
      try {
        const usersUrl = `https://${subdomain}.zendesk.com/api/v2/users/show_many.json?ids=${requesterIds.join(',')}`
        const usersResponse = await fetch(usersUrl, { headers })
        
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

    // Step 4: Format the response with the requested fields including requester info
    const formattedTickets = ticketsData.results.map(ticket => {
      const requester = ticket.requester_id ? requestersMap.get(ticket.requester_id) : null
      
      return {
        ticketId: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status.toUpperCase(),
        priority: ticket.priority,
        type: ticket.type,
        requester: requester ? {
          name: requester.name,
          email: requester.email
        } : null,
        updatedAt: ticket.updated_at,
        createdAt: ticket.created_at
      }
    })

    return NextResponse.json({
      success: true,
      group: {
        id: erpAdminGroup.id,
        name: erpAdminGroup.name,
        description: erpAdminGroup.description
      },
      tickets: formattedTickets,
      totalCount: ticketsData.count,
      currentPage: page,
      perPage: perPage,
      hasNextPage: !!ticketsData.next_page,
      hasPrevPage: !!ticketsData.previous_page,
      message: `Found ${formattedTickets.length} tickets (page ${page}) for ${erpAdminGroup.name} - ${ticketsData.count} total`
    })

  } catch (error) {
    console.error('ERP Admin tickets query error:', error)
    return NextResponse.json({ 
      error: 'Failed to query ERP Admin tickets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}