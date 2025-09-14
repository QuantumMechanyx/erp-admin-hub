'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, ExternalLink, Plus, RefreshCw, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

interface ZendeskTicketsResponse {
  success: boolean
  tickets: ZendeskTicket[]
  message: string
}

interface ImportFormData {
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignedTo: string
  categoryId?: string
  zendeskTicketId: number
}

interface Category {
  id: string
  name: string
}

export function ZendeskTickets() {
  const router = useRouter()
  const [tickets, setTickets] = useState<ZendeskTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<ZendeskTicket | null>(null)
  const [selectedTickets, setSelectedTickets] = useState<Set<number>>(new Set())
  const [categories, setCategories] = useState<Category[]>([])
  const [importing, setImporting] = useState(false)
  const [formData, setFormData] = useState<ImportFormData>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignedTo: '',
    categoryId: '',
    zendeskTicketId: 0
  })

  const fetchTickets = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Use the OAuth token from environment
      const token = process.env.NEXT_PUBLIC_ZENDESK_OAUTH_TOKEN || '5e3357825fce3ff04ff755b3f51ea709f27cd934501ccddc0afdf5b49fe51fdb'
      
      const response = await fetch(`/api/zendesk/tickets/erp-admin?token=${token}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch Zendesk tickets')
      }
      
      const data: ZendeskTicketsResponse = await response.json()
      setTickets(data.tickets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (err) {
      console.warn('Failed to fetch categories:', err)
    }
  }

  useEffect(() => {
    fetchTickets()
    fetchCategories()
  }, [])

  const handleImportClick = (ticket: ZendeskTicket) => {
    setSelectedTicket(ticket)
    setFormData({
      title: ticket.subject,
      description: ticket.description || '',
      priority: mapZendeskPriority(ticket.priority),
      assignedTo: ticket.requester?.email || '',
      categoryId: '',
      zendeskTicketId: ticket.ticketId
    })
    setImportDialogOpen(true)
  }

  const mapZendeskPriority = (zendeskPriority: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' => {
    switch (zendeskPriority.toLowerCase()) {
      case 'urgent': return 'URGENT'
      case 'high': return 'HIGH'
      case 'normal': return 'MEDIUM'
      case 'low': return 'LOW'
      default: return 'MEDIUM'
    }
  }

  const handleTicketSelection = (ticketId: number, checked: boolean) => {
    const newSelected = new Set(selectedTickets)
    if (checked) {
      newSelected.add(ticketId)
    } else {
      newSelected.delete(ticketId)
    }
    setSelectedTickets(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(new Set(tickets.map(t => t.ticketId)))
    } else {
      setSelectedTickets(new Set())
    }
  }

  const handleBulkImport = async () => {
    if (selectedTickets.size === 0) return
    
    setImporting(true)
    
    try {
      const ticketsToImport = tickets.filter(t => selectedTickets.has(t.ticketId))
      const importPromises = ticketsToImport.map(async (ticket) => {
        const response = await fetch('/api/issues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: ticket.subject,
            description: ticket.description || '',
            priority: mapZendeskPriority(ticket.priority),
            assignedTo: ticket.requester?.email || '',
            // Add reference to original Zendesk ticket
            additionalNotes: `Imported from Zendesk Ticket #${ticket.ticketId}\\n\\nOriginal Requester: ${ticket.requester?.name || 'Unknown'} (${ticket.requester?.email || 'N/A'})\\n\\nZendesk Status: ${ticket.status}\\nZendesk Priority: ${ticket.priority}\\nCreated: ${new Date(ticket.createdAt).toLocaleDateString()}\\nLast Updated: ${new Date(ticket.updatedAt).toLocaleDateString()}`
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to create issue for ticket #${ticket.ticketId}`)
        }

        return response.json()
      })

      await Promise.all(importPromises)
      setBulkImportDialogOpen(false)
      setSelectedTickets(new Set())
      
      // Refresh to update dashboard
      router.refresh()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import tickets')
    } finally {
      setImporting(false)
    }
  }

  const handleImport = async () => {
    if (!selectedTicket) return
    
    setImporting(true)
    
    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // Add reference to original Zendesk ticket
          additionalNotes: `Imported from Zendesk Ticket #${selectedTicket.ticketId}\\n\\nOriginal Requester: ${selectedTicket.requester?.name || 'Unknown'} (${selectedTicket.requester?.email || 'N/A'})\\n\\nZendesk Status: ${selectedTicket.status}\\nZendesk Priority: ${selectedTicket.priority}\\nCreated: ${new Date(selectedTicket.createdAt).toLocaleDateString()}\\nLast Updated: ${new Date(selectedTicket.updatedAt).toLocaleDateString()}`
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create issue')
      }

      const newIssue = await response.json()
      setImportDialogOpen(false)
      
      // Redirect to the new issue page
      router.push(`/dashboard/${newIssue.id}`)
      router.refresh() // Refresh to update dashboard
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import ticket')
    } finally {
      setImporting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'destructive'
      case 'pending': return 'secondary'
      case 'solved': return 'default'
      case 'closed': return 'outline'
      default: return 'secondary'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'destructive'
      case 'high': return 'destructive'
      case 'normal': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Zendesk ERP Admin Tickets</CardTitle>
        <div className="flex gap-2">
          {selectedTickets.size > 0 && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setBulkImportDialogOpen(true)}
              disabled={importing}
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Import Selected ({selectedTickets.size})
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchTickets}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-destructive mb-4 p-2 bg-destructive/10 rounded">
            Error: {error}
          </div>
        )}

        {loading && tickets.length === 0 ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading Zendesk tickets...
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground mb-4">
              {tickets.length} tickets found in ERP Admin group
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTickets.size === tickets.length && tickets.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all tickets"
                    />
                  </TableHead>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.ticketId}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTickets.has(ticket.ticketId)}
                        onCheckedChange={(checked) => handleTicketSelection(ticket.ticketId, checked as boolean)}
                        aria-label={`Select ticket #${ticket.ticketId}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      #{ticket.ticketId}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {ticket.subject}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {ticket.requester ? (
                        <div>
                          <div className="font-medium text-sm">{ticket.requester.name}</div>
                          <div className="text-xs text-muted-foreground">{ticket.requester.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://deaconllc.zendesk.com/agent/tickets/${ticket.ticketId}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleImportClick(ticket)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Import
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Zendesk Ticket to Active Issues</DialogTitle>
            </DialogHeader>
            
            {selectedTicket && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Original Zendesk Ticket</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>ID:</strong> #{selectedTicket.ticketId}</div>
                    <div><strong>Status:</strong> {selectedTicket.status}</div>
                    <div><strong>Priority:</strong> {selectedTicket.priority}</div>
                    <div><strong>Requester:</strong> {selectedTicket.requester?.name} ({selectedTicket.requester?.email})</div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="title">Issue Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter issue title..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter issue description..."
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select 
                        value={formData.priority} 
                        onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => 
                          setFormData({ ...formData, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={formData.categoryId} 
                        onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="assignedTo">Assigned To</Label>
                    <Input
                      id="assignedTo"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      placeholder="Enter assignee name or email..."
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setImportDialogOpen(false)}
                    disabled={importing}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleImport}
                    disabled={importing || !formData.title}
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Import to Active Issues
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Bulk Import Dialog */}
        <Dialog open={bulkImportDialogOpen} onOpenChange={setBulkImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Import Zendesk Tickets</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p>You are about to import {selectedTickets.size} tickets to your Active Issues:</p>
              
              <div className="bg-muted/50 p-4 rounded-lg max-h-60 overflow-y-auto">
                {tickets
                  .filter(ticket => selectedTickets.has(ticket.ticketId))
                  .map(ticket => (
                    <div key={ticket.ticketId} className="text-sm py-2 border-b border-border/20 last:border-b-0">
                      <div className="font-medium">#{ticket.ticketId}: {ticket.subject}</div>
                      <div className="text-xs text-muted-foreground">
                        Status: {ticket.status} | Priority: {ticket.priority} | 
                        Requester: {ticket.requester?.name || 'Unknown'}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> All tickets will be imported with default settings:
                </p>
                <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside space-y-1">
                  <li>Title: Original ticket subject</li>
                  <li>Description: Original ticket description</li>
                  <li>Priority: Mapped from Zendesk priority</li>
                  <li>Assigned To: Original requester email</li>
                  <li>Category: None (can be assigned later)</li>
                </ul>
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setBulkImportDialogOpen(false)}
                  disabled={importing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleBulkImport}
                  disabled={importing}
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Importing {selectedTickets.size} tickets...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Import All {selectedTickets.size} Tickets
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}