"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { MessageSquare, Plus, User, Calendar, Paperclip, Download, X, Trash2 } from "lucide-react"
import { formatTimestampPacific } from "@/lib/timezone"
import { deleteNote } from "@/lib/actions"

type Attachment = {
  id: string
  fileName: string
  contentType: string
  size: number
  createdAt: Date
}

type Note = {
  id: string
  content: string
  author?: string | null
  createdAt: Date
  attachments?: Attachment[]
}

interface IssueNotesProps {
  issueId: string
  notes: Note[]
}

export function IssueNotes({ issueId, notes }: IssueNotesProps) {
  const [showAddNote, setShowAddNote] = useState(false)
  const [content, setContent] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (noteId: string) => {
    if (selectedFiles.length === 0) return

    setUploadingFiles(true)
    const uploadPromises = selectedFiles.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('noteId', noteId)
      formData.append('createdBy', 'user') // TODO: Get actual user

      const response = await fetch('/api/attachments/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}`)
      }

      return response.json()
    })

    try {
      await Promise.all(uploadPromises)
    } catch (error) {
      console.error('Error uploading files:', error)
      throw error
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)

    try {
      // Create the note first
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
        // Upload files if any are selected
        if (selectedFiles.length > 0) {
          await uploadFiles(result.note.id)
        }

        setContent("")
        setSelectedFiles([])
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const downloadAttachment = (attachmentId: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = `/api/attachments/${attachmentId}/download`
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDeleteNote = async () => {
    if (!deleteNoteId) return

    setIsDeleting(true)
    try {
      const result = await deleteNote(deleteNoteId, issueId)
      if (result?.success) {
        setDeleteNoteId(null)
        window.location.reload()
      } else if (result?.errors) {
        console.error("Failed to delete note:", result.errors._form?.[0])
      }
    } catch (error) {
      console.error("Failed to delete note:", error)
    } finally {
      setIsDeleting(false)
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

                <div>
                  <Label htmlFor={`files-${issueId}`}>Attachments (optional)</Label>
                  <Input
                    id={`files-${issueId}`}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="mt-1"
                    disabled={isSubmitting}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4" />
                            <span>{file.name}</span>
                            <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isSubmitting || uploadingFiles || !content.trim()}>
                    {isSubmitting || uploadingFiles ? "Adding..." : "Add Note"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddNote(false)
                      setContent("")
                      setSelectedFiles([])
                    }}
                    disabled={isSubmitting || uploadingFiles}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteNoteId(note.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                    </div>
                    {note.attachments && note.attachments.length > 0 && (
                      <div className="border-t pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Paperclip className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Attachments ({note.attachments.length})</span>
                        </div>
                        <div className="space-y-1">
                          {note.attachments.map(attachment => (
                            <div key={attachment.id} className="flex items-center justify-between bg-background border rounded p-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Paperclip className="w-3 h-3 text-muted-foreground" />
                                <span>{attachment.fileName}</span>
                                <span className="text-muted-foreground">({formatFileSize(attachment.size)})</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadAttachment(attachment.id, attachment.fileName)}
                                className="h-6 px-2"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <DeleteConfirmationDialog
        isOpen={!!deleteNoteId}
        onClose={() => setDeleteNoteId(null)}
        onConfirm={handleDeleteNote}
        title="Delete Note"
        description="This will permanently delete the note and all its attachments. This action cannot be undone."
        confirmationText="delete"
        itemName="note"
        isLoading={isDeleting}
      />
    </Card>
  )
}