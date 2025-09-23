"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Ticket, Search, Link2, X, ExternalLink, Loader2 } from "lucide-react"

interface ZendeskTicket {
  ticketId: number
  subject: string
  description?: string
  status: string
  priority: string
  requester: {
    name: string
    email: string
  } | null
  updatedAt: string
  createdAt: string
}

interface LinkedTicket {
  id: string
  zendeskId: number
  subject: string
  description?: string
  status: string
  priority: string
  requesterEmail?: string
  createdAt: string
  updatedAt: string
}

interface RelatedZendeskTicketsProps {
  issueId: string
}

const statusColors = {
  NEW: "bg-blue-100 text-blue-800",
  OPEN: "bg-orange-100 text-orange-800", 
  PENDING: "bg-yellow-100 text-yellow-800",
  HOLD: "bg-gray-100 text-gray-800",
  SOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800"
}

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800",
  NORMAL: "bg-blue-100 text-blue-800",
  HIGH: "bg-yellow-100 text-yellow-800", 
  URGENT: "bg-red-100 text-red-800"
}

export function RelatedZendeskTickets({ issueId }: RelatedZendeskTicketsProps) {
  const [linkedTickets, setLinkedTickets] = useState<LinkedTicket[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ZendeskTicket[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [isLoadingLinked, setIsLoadingLinked] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Load linked tickets on component mount
  useEffect(() => {
    loadLinkedTickets()
  }, [issueId])

  const loadLinkedTickets = async () => {
    try {
      setIsLoadingLinked(true)
      setError(null)
      const response = await fetch(`/api/issues/${issueId}/zendesk-tickets`)
      if (response.ok) {
        const data = await response.json()
        setLinkedTickets(data.tickets || [])
      } else {
        throw new Error('Failed to load linked tickets')
      }
    } catch (error) {
      console.error('Error loading linked tickets:', error)
      setError('Failed to load linked tickets')
    } finally {
      setIsLoadingLinked(false)
    }
  }

  const searchTickets = async () => {
    if (!searchQuery.trim()) return

    try {
      setIsSearching(true)
      setError(null)

      // Use the same OAuth token as the working Zendesk tickets component
      const token = '5e3357825fce3ff04ff755b3f51ea709f27cd934501ccddc0afdf5b49fe51fdb'

      const response = await fetch(`/api/zendesk/tickets?search=${encodeURIComponent(searchQuery)}&token=${token}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.tickets || [])
      } else {
        throw new Error('Search failed')
      }
    } catch (error) {
      console.error('Error searching tickets:', error)
      setError('Unable to search Zendesk tickets. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const linkTicket = async (ticket: ZendeskTicket) => {
    try {
      setIsLinking(true)
      setError(null)
      const response = await fetch(`/api/issues/${issueId}/zendesk-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zendeskTicketId: ticket.ticketId,
          ticketData: {
            subject: ticket.subject,
            description: ticket.description,
            status: ticket.status,
            priority: ticket.priority,
            requester: ticket.requester,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
            type: 'INCIDENT' // Default type
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSuccessMessage(data.message || "Ticket linked successfully")
        
        // Refresh linked tickets and close search
        await loadLinkedTickets()
        setIsSearchOpen(false)
        setSearchQuery("")
        setSearchResults([])
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to link ticket')
      }
    } catch (error) {
      console.error('Error linking ticket:', error)
      setError(error instanceof Error ? error.message : "Unable to link ticket. Please try again.")
    } finally {
      setIsLinking(false)
    }
  }

  const unlinkTicket = async (ticketId: number) => {
    try {
      setError(null)
      const response = await fetch(`/api/issues/${issueId}/zendesk-tickets?ticketId=${ticketId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        setSuccessMessage(data.message || "Ticket unlinked successfully")
        await loadLinkedTickets()
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unlink ticket')
      }
    } catch (error) {
      console.error('Error unlinking ticket:', error)
      setError(error instanceof Error ? error.message : "Unable to unlink ticket. Please try again.")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            Related Zendesk Tickets
          </CardTitle>
          <CardDescription>
            Zendesk tickets linked to this ERP issue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="text-sm text-green-800 bg-green-100 border border-green-200 rounded-md p-2">
              {successMessage}
            </div>
          )}

          <Button 
            onClick={() => setIsSearchOpen(true)} 
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            <Search className="w-4 h-4 mr-2" />
            Link Related Ticket
          </Button>

          {isLoadingLinked ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : linkedTickets.length > 0 ? (
            <div className="space-y-2">
              {linkedTickets.map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <a 
                          href={`https://deaconinc.zendesk.com/agent/tickets/${ticket.zendeskId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                        >
                          #{ticket.zendeskId}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <Badge className={statusColors[ticket.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                          {ticket.status}
                        </Badge>
                        <Badge variant="outline" className={priorityColors[ticket.priority as keyof typeof priorityColors] || "bg-gray-100 text-gray-800"}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground truncate" title={ticket.subject}>
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDate(ticket.createdAt)}
                        {ticket.requesterEmail && ` • ${ticket.requesterEmail}`}
                      </p>
                    </div>
                    <Button
                      onClick={() => unlinkTicket(ticket.zendeskId)}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No related tickets linked yet
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Link Related Zendesk Ticket</DialogTitle>
            <DialogDescription>
              Search for Zendesk tickets to link to this ERP issue
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search tickets by subject, ID, or requester..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchTickets()}
              />
              <Button onClick={searchTickets} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            <ScrollArea className="max-h-[400px]">
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((ticket) => {
                    const isAlreadyLinked = linkedTickets.some(linked => linked.zendeskId === ticket.ticketId)
                    
                    return (
                      <div key={ticket.ticketId} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <a 
                                href={`https://deaconinc.zendesk.com/agent/tickets/${ticket.ticketId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                              >
                                #{ticket.ticketId}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <Badge className={statusColors[ticket.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                                {ticket.status}
                              </Badge>
                              <Badge variant="outline" className={priorityColors[ticket.priority as keyof typeof priorityColors] || "bg-gray-100 text-gray-800"}>
                                {ticket.priority}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium mb-1" title={ticket.subject}>
                              {ticket.subject}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Created {formatDate(ticket.createdAt)}
                              {ticket.requester && ` • ${ticket.requester.name} (${ticket.requester.email})`}
                            </p>
                            {ticket.description && (
                              <details className="mt-2">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                  View description
                                </summary>
                                <p className="text-xs text-muted-foreground mt-1 max-h-20 overflow-y-auto whitespace-pre-wrap border-l-2 border-muted pl-2">
                                  {ticket.description.slice(0, 300)}{ticket.description.length > 300 ? '...' : ''}
                                </p>
                              </details>
                            )}
                          </div>
                          <Button
                            onClick={() => linkTicket(ticket)}
                            disabled={isAlreadyLinked || isLinking}
                            variant={isAlreadyLinked ? "ghost" : "outline"}
                            size="sm"
                          >
                            {isAlreadyLinked ? (
                              <>
                                <Link2 className="w-4 h-4 mr-1" />
                                Linked
                              </>
                            ) : (
                              <>
                                <Link2 className="w-4 h-4 mr-1" />
                                Link
                              </>
                            )}
                          </Button>
                        </div>
                        {isAlreadyLinked && (
                          <p className="text-xs text-muted-foreground">
                            This ticket is already linked to this issue
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : searchQuery && !isSearching ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tickets found matching your search
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Enter a search term to find Zendesk tickets
                </p>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}