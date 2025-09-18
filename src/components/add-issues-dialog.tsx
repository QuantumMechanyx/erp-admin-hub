"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { addMultipleIssuesToMeeting } from "@/lib/meeting-actions"

type Issue = {
  id: string
  title: string
  description?: string | null
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
  category?: { name: string } | null
}

interface AddIssuesDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (addedIssues: Issue[]) => void
  meetingId: string
  availableIssues: Issue[]
  currentIssueIds: string[]
}

export function AddIssuesDialog({ 
  isOpen, 
  onClose, 
  onSuccess,
  meetingId, 
  availableIssues, 
  currentIssueIds
}: AddIssuesDialogProps) {
  const router = useRouter()
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const priorityColors = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-blue-100 text-blue-800", 
    HIGH: "bg-yellow-100 text-yellow-800",
    URGENT: "bg-red-100 text-red-800"
  }

  const statusColors = {
    OPEN: "bg-orange-100 text-orange-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-800"
  }

  // Filter out issues that are already in the meeting
  const selectableIssues = availableIssues.filter(issue => 
    !currentIssueIds.includes(issue.id)
  )

  const handleIssueToggle = (issueId: string, checked: boolean) => {
    if (checked) {
      setSelectedIssueIds(prev => [...prev, issueId])
    } else {
      setSelectedIssueIds(prev => prev.filter(id => id !== issueId))
    }
  }

  const handleClose = useCallback(() => {
    setSelectedIssueIds([])
    setError(null)
    onClose()
  }, [onClose])

  const handleSubmit = async () => {
    if (selectedIssueIds.length === 0) return

    try {
      setIsSubmitting(true)
      setError(null)
      console.log("AddIssuesDialog: Starting submission with issue IDs:", selectedIssueIds)

      const formData = new FormData()
      formData.append('meetingId', meetingId)
      selectedIssueIds.forEach(issueId => {
        formData.append('issueIds', issueId)
      })

      const result = await addMultipleIssuesToMeeting(null, formData)
      console.log("AddIssuesDialog: Server action result:", result)

      if (result?.success) {
        console.log("AddIssuesDialog: Success - refreshing and closing")
        setSelectedIssueIds([])
        window.location.reload()
        onClose()
      } else if (result?.error) {
        console.error("AddIssuesDialog: Server error:", result.error)
        setError(result.error)
      }
    } catch (err) {
      console.error("AddIssuesDialog: Client error:", err)
      setError(err instanceof Error ? err.message : 'Failed to add issues')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Issues to Meeting</DialogTitle>
          <DialogDescription>
            Select issues to add to the current meeting agenda
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

          <div className="space-y-4">
            {selectableIssues.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  All available issues are already in this meeting
                </p>
              </div>
            ) : (
              selectableIssues.map((issue) => (
                <div key={issue.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id={issue.id}
                    checked={selectedIssueIds.includes(issue.id)}
                    onCheckedChange={(checked) => handleIssueToggle(issue.id, checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <label 
                        htmlFor={issue.id}
                        className="font-medium cursor-pointer"
                      >
                        {issue.title}
                      </label>
                      <div className="flex gap-1">
                        <Badge className={priorityColors[issue.priority]} variant="outline">
                          {issue.priority}
                        </Badge>
                        <Badge className={statusColors[issue.status]} variant="outline">
                          {issue.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                    {issue.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {issue.description}
                      </p>
                    )}
                    {issue.category && (
                      <Badge variant="outline" className="mt-2">
                        {issue.category.name}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={selectedIssueIds.length === 0 || isSubmitting}
          >
            {isSubmitting 
              ? "Adding..." 
              : `Add ${selectedIssueIds.length} Issue${selectedIssueIds.length !== 1 ? 's' : ''}`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}