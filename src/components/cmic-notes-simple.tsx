"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"
import { createCmicNote } from "@/lib/actions"

type CmicNote = {
  id: string
  content: string
  author?: string | null
  createdAt: Date
}

interface CmicNotesProps {
  issueId: string
  notes: CmicNote[]
}

export function CmicNotes({ issueId, notes }: CmicNotesProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("issueId", issueId)
    formData.append("content", content)

    try {
      await createCmicNote({}, formData)
      setContent("")
      setShowAddForm(false)
      // Refresh would be handled by parent component
      window.location.reload()
    } catch (error) {
      console.error("Failed to add CMiC note:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <div key={note.id} className="p-2 bg-blue-50 rounded text-sm">
          <p className="whitespace-pre-wrap">{note.content}</p>
          <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
            <span>{note.author || 'Anonymous'}</span>
            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
      
      {!showAddForm && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="w-full justify-start text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add CMiC Note
        </Button>
      )}
      
      {showAddForm && (
        <form onSubmit={handleSubmit} className="space-y-2 p-2 border rounded bg-gray-50">
          <div>
            <Label htmlFor={`cmic-content-${issueId}`} className="text-xs">CMiC Note</Label>
            <Textarea
              id={`cmic-content-${issueId}`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add CMiC communication or ticket updates..."
              className="min-h-[80px] text-sm mt-1"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !content.trim()}
            >
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAddForm(false)
                setContent("")
              }}
              disabled={isSubmitting}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}