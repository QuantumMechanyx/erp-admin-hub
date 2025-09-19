"use client"

import { useState } from "react"
import { useActionState } from "react"
import { updateIssue, createCmicNote } from "@/lib/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Ticket, Plus, Calendar, User, CheckCircle, XCircle } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

type Issue = {
  id: string
  title: string
  cmicTicketNumber?: string | null
  cmicTicketOpened?: Date | null
  cmicTicketClosed: boolean
  procoreTicketNumber?: string | null
  procoreTicketOpened?: Date | null
  procoreTicketClosed: boolean
}

type CmicNote = {
  id: string
  content: string
  author?: string | null
  createdAt: Date
}

interface SupportTicketManagerProps {
  issue: Issue
  cmicNotes: CmicNote[]
}

export function SupportTicketManager({ issue, cmicNotes }: SupportTicketManagerProps) {
  const [showAddNote, setShowAddNote] = useState(false)
  const [ticketType, setTicketType] = useState<'cmic' | 'procore'>('cmic')

  const [ticketState, updateTicketAction] = useActionState(
    (prevState: unknown, formData: FormData) => updateIssue(issue.id, prevState, formData),
    { errors: {} }
  )
  const [noteState, addNoteAction] = useActionState(createCmicNote, { errors: {} })

  const hasCmicTicket = !!issue.cmicTicketNumber
  const hasProcoreTicket = !!issue.procoreTicketNumber
  const hasAnyTicket = hasCmicTicket || hasProcoreTicket

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            <CardTitle>Support Ticket</CardTitle>
            {hasCmicTicket && (
              <Badge variant={issue.cmicTicketClosed ? "default" : "secondary"}>
                {issue.cmicTicketClosed ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 mr-1" />
                )}
                CMiC: {issue.cmicTicketClosed ? "Closed" : "Open"}
              </Badge>
            )}
            {hasProcoreTicket && (
              <Badge variant={issue.procoreTicketClosed ? "default" : "secondary"}>
                {issue.procoreTicketClosed ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 mr-1" />
                )}
                Procore: {issue.procoreTicketClosed ? "Closed" : "Open"}
              </Badge>
            )}
          </div>
          {hasAnyTicket && (
            <Button
              size="sm"
              onClick={() => setShowAddNote(!showAddNote)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          )}
        </div>
        <CardDescription>
          Track support tickets and correspondence from CMiC or Procore for this issue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAnyTicket ? (
          <Card className="border-dashed">
            <CardContent className="pt-4">
              <form action={updateTicketAction} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-muted-foreground">Link an existing support ticket to this issue</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ticketType">Ticket Type *</Label>
                    <Select
                      value={ticketType}
                      onValueChange={(value: 'cmic' | 'procore') => setTicketType(value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select ticket type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cmic">CMiC Support</SelectItem>
                        <SelectItem value="procore">Procore Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${ticketType}TicketNumber`}>
                        {ticketType === 'cmic' ? 'CMiC' : 'Procore'} Ticket Number *
                      </Label>
                      <Input
                        id={`${ticketType}TicketNumber`}
                        name={`${ticketType}TicketNumber`}
                        placeholder="e.g., 12345"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${ticketType}TicketOpened`}>Date Opened</Label>
                      <Input
                        id={`${ticketType}TicketOpened`}
                        name={`${ticketType}TicketOpened`}
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Hidden fields to preserve other issue data */}
                <input type="hidden" name="title" value={issue.title} />
                <input type="hidden" name="priority" value="MEDIUM" />
                <input type="hidden" name="status" value="OPEN" />
                <input type="hidden" name={`${ticketType}TicketClosed`} value="false" />

                {ticketState.errors?._form && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{ticketState.errors._form[0]}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    Link {ticketType === 'cmic' ? 'CMiC' : 'Procore'} Ticket
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTicketType('cmic')}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {hasCmicTicket && (
              <Card className="bg-blue-50/30">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">CMiC Ticket Number</Label>
                      <p className="mt-1">#{issue.cmicTicketNumber}</p>
                    </div>
                    {issue.cmicTicketOpened && (
                      <div>
                        <Label className="font-medium">Date Opened</Label>
                        <p className="mt-1">{format(new Date(issue.cmicTicketOpened), "MMM d, yyyy")}</p>
                      </div>
                    )}
                    <div>
                      <Label className="font-medium">Status</Label>
                      <div className="mt-1">
                        <form action={updateTicketAction} className="inline">
                          <input type="hidden" name="title" value={issue.title} />
                          <input type="hidden" name="priority" value="MEDIUM" />
                          <input type="hidden" name="status" value="OPEN" />
                          <input type="hidden" name="cmicTicketNumber" value={issue.cmicTicketNumber} />
                          {issue.cmicTicketOpened && (
                            <input
                              type="hidden"
                              name="cmicTicketOpened"
                              value={new Date(issue.cmicTicketOpened).toISOString().split('T')[0]}
                            />
                          )}
                          <button
                            type="submit"
                            name="cmicTicketClosed"
                            value={(!issue.cmicTicketClosed).toString()}
                            className="text-blue-600 hover:underline"
                          >
                            {issue.cmicTicketClosed ? "Mark as Open" : "Mark as Closed"}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {hasProcoreTicket && (
              <Card className="bg-green-50/30">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Procore Ticket Number</Label>
                      <p className="mt-1">#{issue.procoreTicketNumber}</p>
                    </div>
                    {issue.procoreTicketOpened && (
                      <div>
                        <Label className="font-medium">Date Opened</Label>
                        <p className="mt-1">{format(new Date(issue.procoreTicketOpened), "MMM d, yyyy")}</p>
                      </div>
                    )}
                    <div>
                      <Label className="font-medium">Status</Label>
                      <div className="mt-1">
                        <form action={updateTicketAction} className="inline">
                          <input type="hidden" name="title" value={issue.title} />
                          <input type="hidden" name="priority" value="MEDIUM" />
                          <input type="hidden" name="status" value="OPEN" />
                          <input type="hidden" name="procoreTicketNumber" value={issue.procoreTicketNumber} />
                          {issue.procoreTicketOpened && (
                            <input
                              type="hidden"
                              name="procoreTicketOpened"
                              value={new Date(issue.procoreTicketOpened).toISOString().split('T')[0]}
                            />
                          )}
                          <button
                            type="submit"
                            name="procoreTicketClosed"
                            value={(!issue.procoreTicketClosed).toString()}
                            className="text-blue-600 hover:underline"
                          >
                            {issue.procoreTicketClosed ? "Mark as Open" : "Mark as Closed"}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {showAddNote && (
              <Card className="border-dashed">
                <CardContent className="pt-4">
                  <form action={addNoteAction} className="space-y-3">
                    <input type="hidden" name="issueId" value={issue.id} />

                    <div>
                      <Label htmlFor="author">Your Name (optional)</Label>
                      <Input
                        id="author"
                        name="author"
                        placeholder="Your name"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="content">Support Communication</Label>
                      <Textarea
                        id="content"
                        name="content"
                        placeholder="Paste email content from support or add manual notes about ticket progress..."
                        rows={6}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Tip: You can paste email content directly - formatting will be automatically cleaned up
                      </p>
                      {noteState.errors?.content && (
                        <p className="text-sm text-red-600 mt-1">{noteState.errors.content[0]}</p>
                      )}
                    </div>

                    {noteState.errors?._form && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-600">{noteState.errors._form[0]}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        Add Note
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddNote(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {cmicNotes.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Badge variant="secondary">{cmicNotes.length}</Badge>
                  Support Communication History
                </h4>
                {cmicNotes.map(note => (
                  <Card key={note.id} className="bg-blue-50/50">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {note.author && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {note.author}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}