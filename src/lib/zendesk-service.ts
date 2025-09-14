import { zendeskConfig, getZendeskHeaders, isZendeskConfigured } from './zendesk-config'
import type { ZendeskTicket, ZendeskUser } from './zendesk-config'

export class ZendeskService {
  private static instance: ZendeskService
  private baseUrl: string

  private constructor() {
    this.baseUrl = zendeskConfig.baseUrl
  }

  public static getInstance(): ZendeskService {
    if (!ZendeskService.instance) {
      ZendeskService.instance = new ZendeskService()
    }
    return ZendeskService.instance
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!isZendeskConfigured()) {
      throw new Error('Zendesk is not properly configured. Please check your environment variables.')
    }

    const url = `${this.baseUrl}${endpoint}`
    const headers = getZendeskHeaders()

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Zendesk API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Zendesk API request failed:', error)
      throw error
    }
  }

  async testConnection(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const response = await this.makeRequest('/users/me.json')
      return {
        success: true,
        user: response.user
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getTickets(params: {
    status?: string[]
    priority?: string[]
    limit?: number
    sort_by?: 'created_at' | 'updated_at' | 'priority' | 'status'
    sort_order?: 'asc' | 'desc'
    created_after?: string
    updated_after?: string
  } = {}): Promise<ZendeskTicket[]> {
    const queryParams = new URLSearchParams()
    
    if (params.limit) {
      queryParams.append('per_page', params.limit.toString())
    }
    
    if (params.sort_by) {
      queryParams.append('sort_by', params.sort_by)
    }
    
    if (params.sort_order) {
      queryParams.append('sort_order', params.sort_order)
    }

    let endpoint = '/tickets.json'
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`
    }

    const response = await this.makeRequest(endpoint)
    let tickets = response.tickets || []

    // Client-side filtering for more complex queries
    if (params.status && params.status.length > 0) {
      tickets = tickets.filter((ticket: ZendeskTicket) => 
        params.status!.includes(ticket.status)
      )
    }

    if (params.priority && params.priority.length > 0) {
      tickets = tickets.filter((ticket: ZendeskTicket) => 
        params.priority!.includes(ticket.priority)
      )
    }

    if (params.created_after) {
      const afterDate = new Date(params.created_after)
      tickets = tickets.filter((ticket: ZendeskTicket) => 
        new Date(ticket.created_at) > afterDate
      )
    }

    if (params.updated_after) {
      const afterDate = new Date(params.updated_after)
      tickets = tickets.filter((ticket: ZendeskTicket) => 
        new Date(ticket.updated_at) > afterDate
      )
    }

    return tickets
  }

  async getTicketById(ticketId: number): Promise<ZendeskTicket> {
    const response = await this.makeRequest(`/tickets/${ticketId}.json`)
    return response.ticket
  }

  async getTicketsByStatus(status: string[]): Promise<ZendeskTicket[]> {
    return this.getTickets({ status })
  }

  async getRecentTickets(days: number = 7): Promise<ZendeskTicket[]> {
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)
    
    return this.getTickets({
      created_after: dateThreshold.toISOString(),
      sort_by: 'created_at',
      sort_order: 'desc'
    })
  }

  async getHighPriorityTickets(): Promise<ZendeskTicket[]> {
    return this.getTickets({
      priority: ['urgent', 'high'],
      status: ['new', 'open', 'pending'],
      sort_by: 'priority',
      sort_order: 'desc'
    })
  }

  async getUser(userId: number): Promise<ZendeskUser> {
    const response = await this.makeRequest(`/users/${userId}.json`)
    return response.user
  }

  async searchTickets(query: string): Promise<ZendeskTicket[]> {
    const encodedQuery = encodeURIComponent(query)
    const response = await this.makeRequest(`/search.json?query=${encodedQuery}&sort_by=created_at&sort_order=desc`)
    
    // Filter only ticket results
    const tickets = response.results?.filter((result: any) => result.result_type === 'ticket') || []
    return tickets.map((result: any) => result)
  }

  async getTicketStats(): Promise<{
    total: number
    open: number
    pending: number
    solved: number
    closed: number
    new: number
    high_priority: number
    urgent_priority: number
  }> {
    try {
      // Get tickets with basic stats
      const [openTickets, pendingTickets, solvedTickets, closedTickets, newTickets, highPriorityTickets] = await Promise.all([
        this.getTicketsByStatus(['open']),
        this.getTicketsByStatus(['pending']),
        this.getTicketsByStatus(['solved']),
        this.getTicketsByStatus(['closed']),
        this.getTicketsByStatus(['new']),
        this.getTickets({ priority: ['high', 'urgent'], status: ['new', 'open', 'pending'] })
      ])

      const urgentTickets = highPriorityTickets.filter(t => t.priority === 'urgent')

      return {
        total: openTickets.length + pendingTickets.length + solvedTickets.length + closedTickets.length + newTickets.length,
        open: openTickets.length,
        pending: pendingTickets.length,
        solved: solvedTickets.length,
        closed: closedTickets.length,
        new: newTickets.length,
        high_priority: highPriorityTickets.filter(t => t.priority === 'high').length,
        urgent_priority: urgentTickets.length
      }
    } catch (error) {
      console.error('Error fetching Zendesk stats:', error)
      return {
        total: 0,
        open: 0,
        pending: 0,
        solved: 0,
        closed: 0,
        new: 0,
        high_priority: 0,
        urgent_priority: 0
      }
    }
  }

  // ERP-specific methods for integration
  async getERPSupportTickets(): Promise<ZendeskTicket[]> {
    // Search for tickets tagged with ERP or containing ERP-related keywords
    const queries = [
      'tags:erp',
      'tags:enterprise',
      'tags:system',
      '"ERP" type:ticket',
      '"enterprise resource planning" type:ticket'
    ]

    const allTickets: ZendeskTicket[] = []
    
    for (const query of queries) {
      try {
        const tickets = await this.searchTickets(query)
        allTickets.push(...tickets)
      } catch (error) {
        console.warn(`Failed to search for query "${query}":`, error)
      }
    }

    // Remove duplicates based on ticket ID
    const uniqueTickets = allTickets.filter((ticket, index, self) => 
      index === self.findIndex(t => t.id === ticket.id)
    )

    return uniqueTickets
  }
}

export const zendeskService = ZendeskService.getInstance()