"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Plus, Trash2, Edit2, Ticket, ExternalLink, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { formatTimestampPacific } from "@/lib/timezone"

interface VendorTicket {
  id: string
  issueId: string
  ticketNumber: string
  vendor: 'CMIC' | 'PROCORE' | 'OTHER'
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  description?: string
  dateOpened: string
  dateClosed?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface VendorTicketsProps {
  issueId: string
}

const vendorColors = {
  CMIC: 'bg-blue-100 text-blue-800',
  PROCORE: 'bg-orange-100 text-orange-800',
  OTHER: 'bg-gray-100 text-gray-800'
}

const statusColors = {
  OPEN: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800'
}

export function VendorTickets({ issueId }: VendorTicketsProps) {
  const [tickets, setTickets] = useState<VendorTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<VendorTicket | null>(null)
  const [formData, setFormData] = useState({
    ticketNumber: '',
    vendor: 'PROCORE' as 'CMIC' | 'PROCORE' | 'OTHER',
    status: 'OPEN' as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
    description: '',
    dateOpened: format(new Date(), 'yyyy-MM-dd'),
    dateClosed: '',
    notes: ''
  })

  useEffect(() => {
    fetchVendorTickets()
  }, [issueId])

  const fetchVendorTickets = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/vendor-tickets?issueId=${issueId}`)
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Error fetching vendor tickets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingTicket
        ? `/api/vendor-tickets/${editingTicket.id}`
        : '/api/vendor-tickets'

      const method = editingTicket ? 'PATCH' : 'POST'

      const body = editingTicket
        ? { ...formData }
        : { ...formData, issueId }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchVendorTickets()
        setIsAddDialogOpen(false)
        setEditingTicket(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving vendor ticket:', error)
    }
  }

  const handleDelete = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return

    try {
      const response = await fetch(`/api/vendor-tickets/${ticketId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchVendorTickets()
      }
    } catch (error) {
      console.error('Error deleting vendor ticket:', error)
    }
  }

  const handleEdit = (ticket: VendorTicket) => {
    setFormData({
      ticketNumber: ticket.ticketNumber,
      vendor: ticket.vendor,
      status: ticket.status,
      description: ticket.description || '',
      dateOpened: format(new Date(ticket.dateOpened), 'yyyy-MM-dd'),
      dateClosed: ticket.dateClosed ? format(new Date(ticket.dateClosed), 'yyyy-MM-dd') : '',
      notes: ticket.notes || ''
    })
    setEditingTicket(ticket)
    setIsAddDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      ticketNumber: '',
      vendor: 'PROCORE',
      status: 'OPEN',
      description: '',
      dateOpened: format(new Date(), 'yyyy-MM-dd'),
      dateClosed: '',
      notes: ''
    })
    setEditingTicket(null)
  }

  const getTicketLink = (vendor: string, ticketNumber: string) => {
    // These are example URLs - replace with actual vendor ticket URLs
    switch (vendor) {
      case 'CMIC':
        return `https://cmic.example.com/tickets/${ticketNumber}`
      case 'PROCORE':
        return `https://procore.example.com/tickets/${ticketNumber}`
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Vendor Support Tickets
            </CardTitle>
            <CardDescription>
              Track support tickets from CMiC, Procore, and other vendors
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) {
              resetForm()
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTicket ? 'Edit Vendor Ticket' : 'Add Vendor Ticket'}
                </DialogTitle>
                <DialogDescription>
                  {editingTicket ? 'Update the vendor ticket details' : 'Add a new vendor support ticket to this issue'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor</Label>
                    <Select
                      value={formData.vendor}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        vendor: value as 'CMIC' | 'PROCORE' | 'OTHER'
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CMIC">CMiC</SelectItem>
                        <SelectItem value="PROCORE">Procore</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticketNumber">Ticket Number</Label>
                    <Input
                      id="ticketNumber"
                      value={formData.ticketNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, ticketNumber: e.target.value }))}
                      placeholder="e.g., 12345"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      status: value as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the issue..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOpened">Date Opened</Label>
                    <Input
                      id="dateOpened"
                      type="date"
                      value={formData.dateOpened}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOpened: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateClosed">Date Closed</Label>
                    <Input
                      id="dateClosed"
                      type="date"
                      value={formData.dateClosed}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateClosed: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTicket ? 'Update' : 'Add'} Ticket
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Ticket className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No vendor tickets added yet</p>
            <p className="text-sm mt-1">Click "Add Ticket" to track vendor support tickets</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const ticketLink = getTicketLink(ticket.vendor, ticket.ticketNumber)

              return (
                <div
                  key={ticket.id}
                  className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={vendorColors[ticket.vendor]}>
                          {ticket.vendor}
                        </Badge>
                        {ticketLink ? (
                          <a
                            href={ticketLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline flex items-center gap-1"
                          >
                            #{ticket.ticketNumber}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="font-medium">#{ticket.ticketNumber}</span>
                        )}
                        <Badge className={statusColors[ticket.status]}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      {ticket.description && (
                        <p className="text-sm text-muted-foreground">{ticket.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Opened: {formatTimestampPacific(ticket.dateOpened)}
                        </span>
                        {ticket.dateClosed && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Closed: {formatTimestampPacific(ticket.dateClosed)}
                          </span>
                        )}
                      </div>

                      {ticket.notes && (
                        <p className="text-sm text-muted-foreground bg-muted rounded p-2 mt-2">
                          {ticket.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(ticket)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(ticket.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}