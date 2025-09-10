"use client"

import { useState } from "react"
import { useActionState } from "react"
import { createNote } from "@/lib/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Plus, User, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type Note = {
  id: string
  content: string
  author?: string | null
  createdAt: Date
}

interface IssueNotesProps {
  issueId: string
  notes: Note[]
}

export function IssueNotes({ issueId, notes }: IssueNotesProps) {
  const [showAddNote, setShowAddNote] = useState(false)
  const [state, formAction] = useActionState(createNote, { errors: {} })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <CardTitle>Notes</CardTitle>
            <Badge variant="secondary">{notes.length}</Badge>
          </div>
          <Button 
            size="sm" 
            onClick={() => setShowAddNote(!showAddNote)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>
        <CardDescription>
          Track progress, updates, and observations about this issue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddNote && (
          <Card className="border-dashed">
            <CardContent className="pt-4">
              <form action={formAction} className="space-y-3">
                <input type="hidden" name="issueId" value={issueId} />
                
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
                  <Label htmlFor="content">Note Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="Add your note, update, or observation..."
                    rows={3}
                    className="mt-1"
                  />
                  {state.errors?.content && (
                    <p className="text-sm text-red-600 mt-1">{state.errors.content[0]}</p>
                  )}
                </div>
                
                {state.errors?._form && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{state.errors._form[0]}</p>
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

        {notes.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No notes yet</p>
            <p className="text-sm text-muted-foreground">
              Add the first note to start tracking progress
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map(note => (
              <Card key={note.id} className="bg-muted/30">
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
      </CardContent>
    </Card>
  )
}