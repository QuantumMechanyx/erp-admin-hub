"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Plus, User, Calendar } from "lucide-react"
import { formatTimestampPacific } from "@/lib/timezone"

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
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueId,
          content: content.trim(),
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setContent("")
        setShowAddNote(false)
        window.location.reload()
      } else {
        console.error("Failed to create note:", result.errors)
      }
    } catch (error) {
      console.error("Failed to create note:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

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
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label htmlFor={`content-${issueId}`}>Note Content</Label>
                  <Textarea
                    id={`content-${issueId}`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Add your note, update, or observation..."
                    rows={4}
                    className="mt-1"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isSubmitting || !content.trim()}>
                    {isSubmitting ? "Adding..." : "Add Note"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddNote(false)
                      setContent("")
                    }}
                    disabled={isSubmitting}
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
                          {formatTimestampPacific(note.createdAt)}
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