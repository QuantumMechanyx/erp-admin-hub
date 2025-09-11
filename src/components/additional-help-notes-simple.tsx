"use client"

import { useState } from "react"
import { useActionState } from "react"
import { createAdditionalHelpNote, deleteAdditionalHelpNote } from "@/lib/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, User, Calendar, X } from "lucide-react"
import { formatDistanceToNowPacific } from "@/lib/timezone"

type AdditionalHelpNote = {
  id: string
  content: string
  author?: string | null
  createdAt: Date
}

interface AdditionalHelpNotesProps {
  issueId: string
  notes: AdditionalHelpNote[]
}

export function AdditionalHelpNotes({ issueId, notes }: AdditionalHelpNotesProps) {
  const [showAddNote, setShowAddNote] = useState(false)
  const [state, formAction] = useActionState(createAdditionalHelpNote, { errors: {} })

  const handleDeleteNote = async (noteId: string) => {
    if (confirm("Are you sure you want to delete this Additional Help note?")) {
      try {
        await deleteAdditionalHelpNote(noteId, issueId)
      } catch (error) {
        console.error("Failed to delete note:", error)
      }
    }
  }

  return (
    <Card className="bg-white">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Areas where assistance is needed</span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowAddNote(!showAddNote)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Request
          </Button>
        </div>

        {showAddNote && (
          <form action={formAction} className="space-y-3 p-3 border rounded-lg bg-muted/20">
            <input type="hidden" name="issueId" value={issueId} />
            
            <div className="space-y-2">
              <Label htmlFor="author" className="text-xs">Your Name (optional)</Label>
              <Input 
                id="author"
                name="author" 
                placeholder="Enter your name..."
                className="text-sm h-8"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content" className="text-xs">Additional Help Request *</Label>
              <Textarea
                id="content"
                name="content"
                placeholder="Describe what assistance is needed..."
                rows={2}
                className="text-sm resize-none"
                required
              />
              {state.errors?.content && (
                <p className="text-xs text-destructive">{state.errors.content}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="h-8 text-xs">
                Add Request
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowAddNote(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
        
        {notes.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-xs">No additional help requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className="p-3 border rounded-lg bg-orange-50 border-orange-200 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-orange-800">
                    {note.author && (
                      <>
                        <User className="w-3 h-3" />
                        <span className="font-medium">{note.author}</span>
                        <span>•</span>
                      </>
                    )}
                    <Calendar className="w-3 h-3" />
                    <span>{formatDistanceToNowPacific(note.createdAt)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                    className="h-5 w-5 p-0 hover:bg-red-50"
                    title="Delete this Additional Help note"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-orange-900 whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}