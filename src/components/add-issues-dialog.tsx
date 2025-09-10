"use client"

import { useState, useActionState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  meetingId: string
  availableIssues: Issue[]
  currentIssueIds: string[]
}

export function AddIssuesDialog({ 
  isOpen, 
  onClose, 
  meetingId, 
  availableIssues, 
  currentIssueIds
}: AddIssuesDialogProps) {
  const [state, formAction, isPending] = useActionState(addMultipleIssuesToMeeting, null)
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([])

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
    onClose()
  }, [onClose])

  // Close dialog on successful submission
  useEffect(() => {
    if (state?.success) {
      setSelectedIssueIds([])
      onClose()
    }
  }, [state?.success, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <form action={formAction}>
          <input type="hidden" name="meetingId" value={meetingId} />
          {selectedIssueIds.map(issueId => (
            <input key={issueId} type="hidden" name="issueIds" value={issueId} />
          ))}

          <DialogHeader>
            <DialogTitle>Add Issues to Meeting</DialogTitle>
            <DialogDescription>
              Select issues to add to the current meeting agenda
            </DialogDescription>
          </DialogHeader>

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
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={selectedIssueIds.length === 0 || isPending}
            >
              {isPending 
                ? "Adding..." 
                : `Add ${selectedIssueIds.length} Issue${selectedIssueIds.length !== 1 ? 's' : ''}`
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}