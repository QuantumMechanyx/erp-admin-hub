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
import { Ticket, Plus, Calendar, User, CheckCircle, XCircle } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

type Issue = {
  id: string
  title: string
  cmicTicketNumber?: string | null
  cmicTicketOpened?: Date | null
  cmicTicketClosed: boolean
}

type CmicNote = {
  id: string
  content: string
  author?: string | null
  createdAt: Date
}

interface CmicTicketManagerProps {
  issue: Issue
  cmicNotes: CmicNote[]
}

export function CmicTicketManager({ issue, cmicNotes }: CmicTicketManagerProps) {
  const [showAddNote, setShowAddNote] = useState(false)
  
  const [ticketState, updateTicketAction] = useActionState(
    (prevState: unknown, formData: FormData) => updateIssue(issue.id, prevState, formData), 
    { errors: {} }
  )
  const [noteState, addNoteAction] = useActionState(createCmicNote, { errors: {} })

  const hasTicket = !!issue.cmicTicketNumber

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            <CardTitle>CMiC Support Ticket</CardTitle>
            {hasTicket && (
              <Badge variant={issue.cmicTicketClosed ? "default" : "secondary"}>
                {issue.cmicTicketClosed ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 mr-1" />
                )}
                {issue.cmicTicketClosed ? "Closed" : "Open"}
              </Badge>
            )}
          </div>
          {hasTicket && (
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
          Track CMiC support ticket and correspondence for this issue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasTicket ? (
          <Card className="border-dashed">
            <CardContent className="pt-4">
              <form action={updateTicketAction} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-muted-foreground">Link an existing CMiC support ticket to this issue</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cmicTicketNumber">Ticket Number *</Label>
                    <Input
                      id="cmicTicketNumber"
                      name="cmicTicketNumber"
                      placeholder="e.g., 12345"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cmicTicketOpened">Date Opened</Label>
                    <Input
                      id="cmicTicketOpened"
                      name="cmicTicketOpened"
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                {/* Hidden fields to preserve other issue data */}
                <input type="hidden" name="title" value={issue.title} />
                <input type="hidden" name="priority" value="MEDIUM" />
                <input type="hidden" name="status" value="OPEN" />
                <input type="hidden" name="cmicTicketClosed" value="false" />
                
                {ticketState.errors?._form && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{ticketState.errors._form[0]}</p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    Link CMiC Ticket
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddTicket(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">Ticket Number</Label>
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
                      <Label htmlFor="content">CMiC Communication</Label>
                      <Textarea
                        id="content"
                        name="content"
                        placeholder="Paste email content from CMiC support or add manual notes about ticket progress..."
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
                  CMiC Communication History
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