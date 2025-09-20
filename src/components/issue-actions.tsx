"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { deleteIssue, archiveIssue } from "@/lib/actions"
import { Settings, Trash2, ExternalLink, Archive } from "lucide-react"
import { useState } from "react"

type Issue = {
  id: string
  title: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
  category?: { name: string; color?: string } | null
  createdAt: Date
  updatedAt: Date
}

interface IssueActionsProps {
  issue: Issue
}

export function IssueActions({ issue }: IssueActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteIssue(issue.id)
      if (result?.success) {
        setShowDeleteDialog(false)
        // Navigate back to dashboard after successful deletion
        window.location.href = "/dashboard"
      } else if (result?.errors) {
        console.error("Failed to delete issue:", result.errors._form?.[0])
      }
    } catch (error) {
      console.error("Failed to delete issue:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleArchiveConfirm = async () => {
    setIsArchiving(true)
    try {
      await archiveIssue(issue.id)
      setShowArchiveDialog(false)
    } catch (error) {
      console.error("Failed to archive issue:", error)
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <CardTitle>Quick Actions</CardTitle>
        </div>
        <CardDescription>
          Manage this issue or take quick actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href={`/meetings?issue=${issue.id}`}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Add to Meeting
            </Link>
          </Button>
          
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href={`/emails?issue=${issue.id}`}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Include in Email
            </Link>
          </Button>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-2">Issue Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority:</span>
              <Badge variant="outline">{issue.priority}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline">{issue.status.replace("_", " ")}</Badge>
            </div>
            {issue.category && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <Badge variant="outline">{issue.category.name}</Badge>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => setShowArchiveDialog(true)}
            disabled={isArchiving}
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive Issue
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Issue
          </Button>
        </div>
      </CardContent>

      <DeleteConfirmationDialog
        isOpen={showArchiveDialog}
        onClose={() => setShowArchiveDialog(false)}
        onConfirm={handleArchiveConfirm}
        title="Archive Issue"
        description="This will archive the issue, removing it from active lists while preserving all data. Archived issues can be restored if needed."
        confirmationText="archive"
        itemName={issue.title}
        isLoading={isArchiving}
      />

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Issue"
        description="This action cannot be undone. This will permanently delete the issue and all associated data including notes, CMiC communications, and meeting references."
        confirmationText="delete"
        itemName={issue.title}
        isLoading={isDeleting}
      />
    </Card>
  )
}