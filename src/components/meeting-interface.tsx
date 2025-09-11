"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { 
  Clock, 
  MessageSquare, 
  AlertTriangle,
  Plus
} from "lucide-react"
import { AddIssuesDialog } from "@/components/add-issues-dialog"

type Meeting = {
  id: string
  title: string
  meetingDate: Date
  status: "PLANNED" | "ACTIVE" | "COMPLETED"
  generalNotes?: string | null
  externalHelp?: string | null
  meetingItems: {
    id: string
    issueId: string
    discussionNotes?: string | null
    carriedOver: boolean
    issue: {
      id: string
      title: string
      description?: string | null
      priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
      status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
      category?: { name: string } | null
    }
  }[]
}

interface MeetingInterfaceProps {
  meeting: Meeting
  availableIssues: unknown[]
}

export function MeetingInterface({ meeting, availableIssues }: MeetingInterfaceProps) {
  const [generalNotes, setGeneralNotes] = useState(meeting.generalNotes || "")
  const [externalHelp, setExternalHelp] = useState(meeting.externalHelp || "")
  const [externalHelpIssueId, setExternalHelpIssueId] = useState<string>("")
  const [itemDiscussionNotes, setItemDiscussionNotes] = useState<Record<string, string>>(
    Object.fromEntries(
      meeting.meetingItems.map(item => [item.issueId, item.discussionNotes || ""])
    )
  )
  const [showAddIssuesDialog, setShowAddIssuesDialog] = useState(false)

  const openAddIssuesDialog = () => {
    setShowAddIssuesDialog(true)
  }

  const handleAddIssuesDialogClose = useCallback(() => {
    setShowAddIssuesDialog(false)
  }, [])

  const formatText = (text: string) => {
    return text
      .replace(/^- (.+)$/gm, '• $1')  // Convert "- item" to "• item"
      .replace(/^\* (.+)$/gm, '• $1')  // Convert "* item" to "• item"
      .replace(/^(\d+)\. (.+)$/gm, '$1. $2')  // Keep numbered lists as is
  }

  const updateItemDiscussionNotes = (itemId: string, notes: string) => {
    const formattedNotes = formatText(notes)
    setItemDiscussionNotes(prev => ({
      ...prev,
      [itemId]: formattedNotes
    }))
  }

  const updateGeneralNotes = (notes: string) => {
    const formattedNotes = formatText(notes)
    setGeneralNotes(formattedNotes)
  }

  const updateExternalHelp = (notes: string) => {
    const formattedNotes = formatText(notes)
    setExternalHelp(formattedNotes)
  }


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

  const carriedOverItems = meeting.meetingItems.filter(item => item.carriedOver)
  const currentItems = meeting.meetingItems.filter(item => !item.carriedOver)

  return (
    <>
      {/* Meeting Header */}
      <Card>
        <CardHeader>
          <CardTitle>{meeting.title}</CardTitle>
          <CardDescription>
            Live note-taking workspace for team discussions
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Carried Over Items */}
        {carriedOverItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Carried Over from Previous Meeting
              </CardTitle>
              <CardDescription>
                Items still in progress from last meeting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {carriedOverItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium">{item.issue.title}</h4>
                    <div className="flex gap-1">
                      <Badge className={priorityColors[item.issue.priority]} variant="outline">
                        {item.issue.priority}
                      </Badge>
                      <Badge className={statusColors[item.issue.status]} variant="outline">
                        {item.issue.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.issue.description}</p>
                  {item.issue.category && (
                    <Badge variant="outline">{item.issue.category.name}</Badge>
                  )}
                  <div className="space-y-2 pt-2 border-t">
                    <h5 className="font-medium text-xs text-muted-foreground">Today&apos;s Discussion:</h5>
                    <Textarea
                      value={itemDiscussionNotes[item.issueId] || ""}
                      onChange={(e) => updateItemDiscussionNotes(item.issueId, e.target.value)}
                      placeholder="Add discussion notes for this item..."
                      className="min-h-[60px] text-sm"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Current Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Current Meeting Items
            </CardTitle>
            <CardDescription>
              New items for today&apos;s discussion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium">{item.issue.title}</h4>
                    <div className="flex gap-1">
                      <Badge className={priorityColors[item.issue.priority]} variant="outline">
                        {item.issue.priority}
                      </Badge>
                      <Badge className={statusColors[item.issue.status]} variant="outline">
                        {item.issue.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.issue.description}</p>
                  {item.issue.category && (
                    <Badge variant="outline">{item.issue.category.name}</Badge>
                  )}
                  <div className="space-y-2 pt-2 border-t">
                    <h5 className="font-medium text-xs text-muted-foreground">Discussion Notes:</h5>
                    <Textarea
                      value={itemDiscussionNotes[item.issueId] || ""}
                      onChange={(e) => updateItemDiscussionNotes(item.issueId, e.target.value)}
                      placeholder="Add discussion notes for this item..."
                      className="min-h-[60px] text-sm"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No items in today&apos;s agenda yet</p>
                <Button variant="outline" onClick={openAddIssuesDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Issues to Meeting
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Help Needed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Additional Help Needed
          </CardTitle>
          <CardDescription>
            Areas requiring collaboration with Accounting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="external-help-issue">Related Issue (Optional)</Label>
            <Select value={externalHelpIssueId} onValueChange={setExternalHelpIssueId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an issue that needs external help..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific issue</SelectItem>
                {availableIssues.map((issue: any) => (
                  <SelectItem key={issue.id} value={issue.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {issue.priority}
                      </Badge>
                      <span className="truncate">{issue.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="external-help-notes">Help Request Details</Label>
            <Textarea
              id="external-help-notes"
              value={externalHelp}
              onChange={(e) => updateExternalHelp(e.target.value)}
              placeholder="Add requests for assistance from Accounting department..."
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* General Meeting Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            General Meeting Notes
          </CardTitle>
          <CardDescription>
            Additional notes, action items, and decisions made
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={generalNotes}
            onChange={(e) => updateGeneralNotes(e.target.value)}
            placeholder="Add general meeting notes, action items, decisions..."
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      <AddIssuesDialog
        isOpen={showAddIssuesDialog}
        onClose={handleAddIssuesDialogClose}
        meetingId={meeting.id}
        availableIssues={availableIssues}
        currentIssueIds={meeting.meetingItems.map(item => item.issueId)}
      />
    </>
  )
}