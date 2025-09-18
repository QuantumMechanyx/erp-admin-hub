"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  MessageSquare, 
  AlertTriangle,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Save,
  Play,
  Square,
  CheckSquare,
  FileText,
  Link
} from "lucide-react"
import { AddIssuesDialog } from "@/components/add-issues-dialog"
import { AdditionalHelpNotes } from "@/components/additional-help-notes-simple"
import { ActionItemForm } from "@/components/action-item-form"
import { CmicNotes } from "@/components/cmic-notes-simple"
import { useMeetingData } from "@/hooks/use-meeting-data"
import { 
  removeIssueFromMeeting, 
  updateMeetingItemNotes, 
  updateMeetingGeneralNotes,
  startMeeting,
  endMeetingAndPrepareNext
} from "@/lib/meeting-actions"

type AdditionalHelpNote = {
  id: string
  content: string
  author?: string | null
  createdAt: Date
}

type ActionItem = {
  id: string
  title: string
  description?: string | null
  completed: boolean
  priority: number
  dueDate?: Date | null
  createdAt: Date
  updatedAt: Date
}

type Note = {
  id: string
  content: string
  author?: string | null
  createdAt: Date
}

type CmicNote = {
  id: string
  content: string
  author?: string | null
  createdAt: Date
}

type Meeting = {
  id: string
  title: string
  meetingDate: Date
  status: "PLANNED" | "ACTIVE" | "COMPLETED"
  generalNotes?: string | null
  externalHelp?: string | null
  startedAt?: Date | null
  meetingItems: {
    id: string
    issueId: string
    discussionNotes?: string | null
    carriedOver: boolean
    issue: {
      id: string
      title: string
      description?: string | null
      additionalHelp?: string | null
      additionalHelpNotes?: AdditionalHelpNote[]
      actionItems?: ActionItem[]
      notes?: Note[]
      cmicNotes?: CmicNote[]
      cmicTicketNumber?: string | null
      cmicTicketClosed: boolean
      cmicTicketOpened?: Date | null
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

export function MeetingInterface({ meeting: initialMeeting, availableIssues }: MeetingInterfaceProps) {
  const {
    meeting,
    generalNotes,
    setGeneralNotes,
    itemDiscussionNotes,
    setItemDiscussionNotes,
    showActionItemForm,
    toggleActionItemForm,
    createActionItem,
    refreshMeeting
  } = useMeetingData(initialMeeting)

  const handleRemoveIssue = async (issueId: string) => {
    try {
      console.log("handleRemoveIssue: Starting removal for issue:", issueId)
      await removeIssueFromMeeting(meeting.id, issueId)
      console.log("handleRemoveIssue: Issue removed successfully, calling refreshMeeting")
      refreshMeeting()
      console.log("handleRemoveIssue: refreshMeeting called")
    } catch (error) {
      console.error("Failed to remove issue:", error)
    }
  }
  
  const [showAddIssuesDialog, setShowAddIssuesDialog] = useState(false)
  const [collapsedHelpNotes, setCollapsedHelpNotes] = useState<Record<string, boolean>>(
    Object.fromEntries(
      meeting.meetingItems.flatMap(item => [
        [item.issue.id, true], // Additional help notes collapsed
        [`${item.issue.id}-actions`, true], // Action items collapsed
        [`${item.issue.id}-notes`, true], // Notes collapsed
        [`${item.issue.id}-cmic`, true] // CMiC ticket collapsed
      ])
    )
  )
  const [generalNotesCollapsed, setGeneralNotesCollapsed] = useState(true)
  
  // Meeting auto-end timers and settings
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null)
  const [isWarningShown, setIsWarningShown] = useState(false)
  const [currentTime, setCurrentTime] = useState(Date.now())
  
  // Configurable meeting timeouts - easily adjustable for different meeting types
  const MEETING_CONFIG = {
    // Inactivity timeouts
    INACTIVITY_WARNING_MINUTES: 15,     // Show warning after this many minutes of inactivity
    INACTIVITY_AUTO_END_MINUTES: 20,    // Auto-end meeting after this many minutes of inactivity
    
    // Maximum meeting duration
    MAX_MEETING_MINUTES: 90,            // Maximum meeting length before auto-end
    
    // Timer check intervals
    ACTIVITY_CHECK_INTERVAL_MS: 60000,  // Check activity every minute
  }
  
  // Convert to milliseconds for internal use
  const INACTIVITY_WARNING_TIME = MEETING_CONFIG.INACTIVITY_WARNING_MINUTES * 60 * 1000
  const INACTIVITY_AUTO_END_TIME = MEETING_CONFIG.INACTIVITY_AUTO_END_MINUTES * 60 * 1000
  const MAX_MEETING_TIME = MEETING_CONFIG.MAX_MEETING_MINUTES * 60 * 1000

  const openAddIssuesDialog = () => {
    setShowAddIssuesDialog(true)
  }

  const handleAddIssuesDialogClose = useCallback(() => {
    setShowAddIssuesDialog(false)
  }, [])


  const formatText = (text: string) => {
    return text
  }

  // Filter out Zendesk import messages
  const isZendeskImportNote = (content: string) => {
    return content.includes("Imported from Zendesk Ticket") && 
           content.includes("Original Requester:") && 
           content.includes("Zendesk Status:") && 
           content.includes("Zendesk Priority:")
  }

  const filterRelevantNotes = (notes: any[]) => {
    return notes.filter(note => !isZendeskImportNote(note.content))
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

  const saveGeneralNotes = async () => {
    try {
      await updateMeetingGeneralNotes(meeting.id, generalNotes)
      console.log("General notes saved successfully")
    } catch (error) {
      console.error("Failed to save general notes:", error)
    }
  }

  const saveDiscussionNotes = async (issueId: string, notes: string) => {
    try {
      await updateMeetingItemNotes(meeting.id, issueId, notes)
      console.log("Discussion notes saved successfully for issue:", issueId)
    } catch (error) {
      console.error("Failed to save discussion notes:", error)
    }
  }

  const saveAllNotes = async () => {
    try {
      // Save general notes
      await updateMeetingGeneralNotes(meeting.id, generalNotes)
      
      // Save all discussion notes
      for (const [issueId, notes] of Object.entries(itemDiscussionNotes)) {
        if (notes.trim()) {
          await updateMeetingItemNotes(meeting.id, issueId, notes)
        }
      }
      
      console.log("All notes saved successfully")
    } catch (error) {
      console.error("Failed to save notes:", error)
    }
  }

  const handleStartMeeting = async () => {
    try {
      await startMeeting(meeting.id)
      refreshMeeting()
    } catch (error) {
      console.error("Failed to start meeting:", error)
    }
  }

  const handleEndMeeting = async (reason?: string) => {
    const confirmMessage = reason 
      ? `The meeting will be automatically ended due to ${reason}. All notes will be saved and the next meeting will be prepared.`
      : "Are you sure you want to end this meeting? This will save all notes and prepare the next meeting with carried-over items."
    
    if (reason || confirm(confirmMessage)) {
      try {
        // Save current notes first
        await saveAllNotes()
        
        // End meeting and prepare next
        const endNote = reason 
          ? `${generalNotes}\n\n--- Meeting ended automatically due to ${reason} ---`
          : generalNotes
          
        await endMeetingAndPrepareNext(meeting.id, endNote)
        
        console.log(`Meeting ended${reason ? ` (${reason})` : ""} and next meeting prepared successfully`)
        window.location.reload() // Refresh to show new meeting
      } catch (error) {
        console.error("Failed to end meeting:", error)
      }
    }
  }

  // Activity tracking functions
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now())
    setIsWarningShown(false)
    
    // Clear any existing inactivity timer
    if (inactivityTimer) {
      clearTimeout(inactivityTimer)
    }
    
    // Only set timers if meeting is active
    if (meeting.status === "ACTIVE") {
      // Set new inactivity timer
      const newTimer = setTimeout(() => {
        const now = Date.now()
        const timeSinceActivity = now - Date.now() // This will be updated by the closure
        
        if (timeSinceActivity >= INACTIVITY_AUTO_END_TIME) {
          handleEndMeeting("inactivity (20+ minutes with no activity)")
        } else if (timeSinceActivity >= INACTIVITY_WARNING_TIME) {
          setIsWarningShown(true)
          const remainingTime = Math.ceil((INACTIVITY_AUTO_END_TIME - timeSinceActivity) / 60000)
          
          if (confirm(`Meeting has been inactive for 15 minutes. The meeting will automatically end in ${remainingTime} minutes unless there is activity. Continue meeting?`)) {
            // User wants to continue - this will trigger a new activity update
            setLastActivity(Date.now())
            setIsWarningShown(false)
          }
        }
      }, INACTIVITY_WARNING_TIME)
      
      setInactivityTimer(newTimer)
    }
  }, [meeting.status, inactivityTimer, INACTIVITY_WARNING_TIME, INACTIVITY_AUTO_END_TIME, handleEndMeeting])


  const checkMaxMeetingTime = useCallback(() => {
    if (meeting.status === "ACTIVE" && meeting.startedAt) {
      const meetingDuration = Date.now() - new Date(meeting.startedAt).getTime()
      
      if (meetingDuration >= MAX_MEETING_TIME) {
        handleEndMeeting("maximum meeting time reached (90 minutes)")
      }
    }
  }, [meeting.status, meeting.startedAt, MAX_MEETING_TIME])

  // Helper function to format meeting duration
  const formatMeetingDuration = (startTime: Date, currentTime: number) => {
    const duration = currentTime - startTime.getTime()
    const minutes = Math.floor(duration / 60000)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${remainingMinutes}m`
  }

  // Timer update for live meeting duration display
  useEffect(() => {
    if (meeting.status === "ACTIVE" && meeting.startedAt) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now())
      }, 1000) // Update every second for live timer

      return () => clearInterval(interval)
    }
  }, [meeting.status, meeting.startedAt])

  // Auto-save with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveGeneralNotes()
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId)
  }, [generalNotes, meeting.id])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      Object.entries(itemDiscussionNotes).forEach(([issueId, notes]) => {
        if (notes.trim()) {
          saveDiscussionNotes(issueId, notes)
        }
      })
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId)
  }, [itemDiscussionNotes, meeting.id])

  // Activity tracking and meeting auto-end functionality
  useEffect(() => {
    if (meeting.status !== "ACTIVE") return

    // Set up activity listeners to track user interaction
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true)
    })

    // Initial activity timer setup
    updateActivity()

    // Set up max meeting time checker
    const maxTimeInterval = setInterval(checkMaxMeetingTime, MEETING_CONFIG.ACTIVITY_CHECK_INTERVAL_MS)

    // Clean up listeners and timers
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity, true)
      })
      
      if (inactivityTimer) {
        clearTimeout(inactivityTimer)
      }
      
      clearInterval(maxTimeInterval)
    }
  }, [meeting.status, updateActivity, checkMaxMeetingTime, inactivityTimer])

  // Window close detection to auto-end meeting
  useEffect(() => {
    if (meeting.status !== "ACTIVE") return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Try to end meeting gracefully on window close
      handleEndMeeting("browser window closed")
      
      // Show confirmation dialog to user
      e.preventDefault()
      e.returnValue = "The meeting is still active. Are you sure you want to close? This will automatically end the meeting."
      return e.returnValue
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [meeting.status])

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{meeting.title}</CardTitle>
              <CardDescription>
                Live note-taking workspace for team discussions
                {meeting.status === "ACTIVE" && meeting.startedAt && (
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Meeting duration: {formatMeetingDuration(new Date(meeting.startedAt), currentTime)}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Auto-end: {MEETING_CONFIG.MAX_MEETING_MINUTES}min max | {MEETING_CONFIG.INACTIVITY_AUTO_END_MINUTES}min inactivity
                    </div>
                  </div>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {meeting.status === "PLANNED" && (
                <Button onClick={handleStartMeeting} variant="default">
                  <Play className="w-4 h-4 mr-2" />
                  Start Meeting
                </Button>
              )}
              {meeting.status === "ACTIVE" && (
                <Button onClick={handleEndMeeting} variant="destructive">
                  <Square className="w-4 h-4 mr-2" />
                  End Meeting
                </Button>
              )}
              {meeting.status === "COMPLETED" && (
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  Meeting Completed
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-6">
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
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {carriedOverItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium">{item.issue.title}</h4>
                    <div className="flex gap-1 items-center">
                      <Badge className={priorityColors[item.issue.priority]} variant="outline">
                        {item.issue.priority}
                      </Badge>
                      <Badge className={statusColors[item.issue.status]} variant="outline">
                        {item.issue.status.replaceAll("_", " ")}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveIssue(item.issueId)}
                        className="h-6 w-6 p-0 hover:bg-red-50"
                        title="Remove from meeting"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.issue.description}</p>
                  {item.issue.category && (
                    <Badge variant="outline">{item.issue.category.name}</Badge>
                  )}
                  {item.issue.additionalHelpNotes && item.issue.additionalHelpNotes.length > 0 && (
                    <div className="border rounded-lg">
                      <div className="flex items-center justify-between p-3 pb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          <h6 className="text-sm font-medium">Additional Help Needed</h6>
                          <Badge variant="secondary" className="text-xs">{item.issue.additionalHelpNotes.length}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCollapsedHelpNotes(prev => ({
                            ...prev,
                            [item.issue.id]: !prev[item.issue.id]
                          }))}
                          className="p-1 h-6 w-6"
                        >
                          {collapsedHelpNotes[item.issue.id] ? (
                            <ChevronRight className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      {!collapsedHelpNotes[item.issue.id] && (
                        <div className="px-3 pb-3">
                          <AdditionalHelpNotes 
                            issueId={item.issue.id} 
                            notes={item.issue.additionalHelpNotes || []}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {item.issue.actionItems && item.issue.actionItems.length > 0 && (
                    <div className="border rounded-lg">
                      <div className="flex items-center justify-between p-3 pb-2">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                          <h6 className="text-sm font-medium">Action Items</h6>
                          <Badge variant="secondary" className="text-xs">{item.issue.actionItems.length}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCollapsedHelpNotes(prev => ({
                            ...prev,
                            [`${item.issue.id}-actions`]: !prev[`${item.issue.id}-actions`]
                          }))}
                          className="p-1 h-6 w-6"
                        >
                          {collapsedHelpNotes[`${item.issue.id}-actions`] ? (
                            <ChevronRight className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      {!collapsedHelpNotes[`${item.issue.id}-actions`] && (
                        <div className="px-3 pb-3 space-y-2">
                          {item.issue.actionItems.map((actionItem) => (
                            <div key={actionItem.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm">
                              <div className={`w-3 h-3 rounded-sm border mt-0.5 ${actionItem.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`} />
                              <div className="flex-1">
                                <p className={actionItem.completed ? 'line-through text-gray-500' : ''}>{actionItem.title}</p>
                                {actionItem.description && (
                                  <p className="text-xs text-gray-600 mt-1">{actionItem.description}</p>
                                )}
                                {actionItem.dueDate && (
                                  <p className="text-xs text-blue-600 mt-1">Due: {new Date(actionItem.dueDate).toLocaleDateString()}</p>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {/* Add Action Item */}
                          {!showActionItemForm[item.issue.id] && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleActionItemForm(item.issue.id)}
                              className="w-full justify-start text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Action Item
                            </Button>
                          )}
                          
                          {showActionItemForm[item.issue.id] && (
                            <ActionItemForm
                              issueId={item.issue.id}
                              onSubmit={createActionItem}
                              onCancel={() => toggleActionItemForm(item.issue.id)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {item.issue.cmicTicketNumber && (
                    <div className="border rounded-lg">
                      <div className="flex items-center justify-between p-3 pb-2">
                        <div className="flex items-center gap-2">
                          <Link className="w-4 h-4 text-purple-600" />
                          <h6 className="text-sm font-medium">CMiC Ticket</h6>
                          <Badge variant="secondary" className="text-xs">#{item.issue.cmicTicketNumber}</Badge>
                          <Badge variant={item.issue.cmicTicketClosed ? "default" : "secondary"} className="text-xs">
                            {item.issue.cmicTicketClosed ? "Closed" : "Open"}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCollapsedHelpNotes(prev => ({
                            ...prev,
                            [`${item.issue.id}-cmic`]: !prev[`${item.issue.id}-cmic`]
                          }))}
                          className="p-1 h-6 w-6"
                        >
                          {collapsedHelpNotes[`${item.issue.id}-cmic`] ? (
                            <ChevronRight className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      {!collapsedHelpNotes[`${item.issue.id}-cmic`] && (
                        <div className="px-3 pb-3">
                          {item.issue.cmicTicketOpened && (
                            <p className="text-xs text-gray-500 mb-2">
                              Opened: {new Date(item.issue.cmicTicketOpened).toLocaleDateString()}
                            </p>
                          )}
                          <CmicNotes 
                            issueId={item.issue.id} 
                            notes={item.issue.cmicNotes || []}
                          />
                        </div>
                      )}
                    </div>
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
                  {item.issue.notes && filterRelevantNotes(item.issue.notes).length > 0 && (
                    <div className="border rounded-lg">
                      <div className="flex items-center justify-between p-3 pb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <h6 className="text-sm font-medium">Issue Notes</h6>
                          <Badge variant="secondary" className="text-xs">{filterRelevantNotes(item.issue.notes).length}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCollapsedHelpNotes(prev => ({
                            ...prev,
                            [`${item.issue.id}-notes`]: !prev[`${item.issue.id}-notes`]
                          }))}
                          className="p-1 h-6 w-6"
                        >
                          {collapsedHelpNotes[`${item.issue.id}-notes`] ? (
                            <ChevronRight className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      {!collapsedHelpNotes[`${item.issue.id}-notes`] && (
                        <div className="px-3 pb-3 space-y-2">
                          {filterRelevantNotes(item.issue.notes).map((note) => (
                            <div key={note.id} className="p-2 bg-gray-50 rounded text-sm">
                              <p>{note.content}</p>
                              <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                                <span>{note.author || 'Anonymous'}</span>
                                <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Current Meeting Items
                </CardTitle>
                <CardDescription>
                  New items for today&apos;s discussion
                </CardDescription>
              </div>
              <Button variant="outline" onClick={openAddIssuesDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Issues
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {currentItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium">{item.issue.title}</h4>
                      <div className="flex gap-1 items-center">
                        <Badge className={priorityColors[item.issue.priority]} variant="outline">
                          {item.issue.priority}
                        </Badge>
                        <Badge className={statusColors[item.issue.status]} variant="outline">
                          {item.issue.status.replaceAll("_", " ")}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveIssue(item.issueId)}
                          className="h-6 w-6 p-0 hover:bg-red-50"
                          title="Remove from meeting"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.issue.description}</p>
                    {item.issue.category && (
                      <Badge variant="outline">{item.issue.category.name}</Badge>
                    )}
                    {item.issue.additionalHelpNotes && item.issue.additionalHelpNotes.length > 0 && (
                      <div className="border rounded-lg">
                        <div className="flex items-center justify-between p-3 pb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <h6 className="text-sm font-medium">Additional Help Needed</h6>
                            <Badge variant="secondary" className="text-xs">{item.issue.additionalHelpNotes.length}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCollapsedHelpNotes(prev => ({
                              ...prev,
                              [item.issue.id]: !prev[item.issue.id]
                            }))}
                            className="p-1 h-6 w-6"
                          >
                            {collapsedHelpNotes[item.issue.id] ? (
                              <ChevronRight className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        {!collapsedHelpNotes[item.issue.id] && (
                          <div className="px-3 pb-3">
                            <AdditionalHelpNotes 
                              issueId={item.issue.id} 
                              notes={item.issue.additionalHelpNotes || []}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {item.issue.actionItems && item.issue.actionItems.length > 0 && (
                      <div className="border rounded-lg">
                        <div className="flex items-center justify-between p-3 pb-2">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                            <h6 className="text-sm font-medium">Action Items</h6>
                            <Badge variant="secondary" className="text-xs">{item.issue.actionItems.length}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCollapsedHelpNotes(prev => ({
                              ...prev,
                              [`${item.issue.id}-actions`]: !prev[`${item.issue.id}-actions`]
                            }))}
                            className="p-1 h-6 w-6"
                          >
                            {collapsedHelpNotes[`${item.issue.id}-actions`] ? (
                              <ChevronRight className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        {!collapsedHelpNotes[`${item.issue.id}-actions`] && (
                          <div className="px-3 pb-3 space-y-2">
                            {item.issue.actionItems.map((actionItem) => (
                              <div key={actionItem.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm">
                                <div className={`w-3 h-3 rounded-sm border mt-0.5 ${actionItem.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`} />
                                <div className="flex-1">
                                  <p className={actionItem.completed ? 'line-through text-gray-500' : ''}>{actionItem.title}</p>
                                  {actionItem.description && (
                                    <p className="text-xs text-gray-600 mt-1">{actionItem.description}</p>
                                  )}
                                  {actionItem.dueDate && (
                                    <p className="text-xs text-blue-600 mt-1">Due: {new Date(actionItem.dueDate).toLocaleDateString()}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {/* Add Action Item */}
                            {!showActionItemForm[item.issue.id] && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleActionItemForm(item.issue.id)}
                                className="w-full justify-start text-xs"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Action Item
                              </Button>
                            )}
                            
                            {showActionItemForm[item.issue.id] && (
                              <ActionItemForm
                                issueId={item.issue.id}
                                onSubmit={createActionItem}
                                onCancel={() => toggleActionItemForm(item.issue.id)}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {item.issue.cmicTicketNumber && (
                      <div className="border rounded-lg">
                        <div className="flex items-center justify-between p-3 pb-2">
                          <div className="flex items-center gap-2">
                            <Link className="w-4 h-4 text-purple-600" />
                            <h6 className="text-sm font-medium">CMiC Ticket</h6>
                            <Badge variant="secondary" className="text-xs">#{item.issue.cmicTicketNumber}</Badge>
                            <Badge variant={item.issue.cmicTicketClosed ? "default" : "secondary"} className="text-xs">
                              {item.issue.cmicTicketClosed ? "Closed" : "Open"}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCollapsedHelpNotes(prev => ({
                              ...prev,
                              [`${item.issue.id}-cmic`]: !prev[`${item.issue.id}-cmic`]
                            }))}
                            className="p-1 h-6 w-6"
                          >
                            {collapsedHelpNotes[`${item.issue.id}-cmic`] ? (
                              <ChevronRight className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        {!collapsedHelpNotes[`${item.issue.id}-cmic`] && (
                          <div className="px-3 pb-3">
                            {item.issue.cmicTicketOpened && (
                              <p className="text-xs text-gray-500 mb-2">
                                Opened: {new Date(item.issue.cmicTicketOpened).toLocaleDateString()}
                              </p>
                            )}
                            <CmicNotes 
                              issueId={item.issue.id} 
                              notes={item.issue.cmicNotes || []}
                            />
                          </div>
                        )}
                      </div>
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
                    {item.issue.notes && filterRelevantNotes(item.issue.notes).length > 0 && (
                      <div className="border rounded-lg">
                        <div className="flex items-center justify-between p-3 pb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            <h6 className="text-sm font-medium">Issue Notes</h6>
                            <Badge variant="secondary" className="text-xs">{filterRelevantNotes(item.issue.notes).length}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCollapsedHelpNotes(prev => ({
                              ...prev,
                              [`${item.issue.id}-notes`]: !prev[`${item.issue.id}-notes`]
                            }))}
                            className="p-1 h-6 w-6"
                          >
                            {collapsedHelpNotes[`${item.issue.id}-notes`] ? (
                              <ChevronRight className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        {!collapsedHelpNotes[`${item.issue.id}-notes`] && (
                          <div className="px-3 pb-3 space-y-2">
                            {filterRelevantNotes(item.issue.notes).map((note) => (
                              <div key={note.id} className="p-2 bg-gray-50 rounded text-sm">
                                <p>{note.content}</p>
                                <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                                  <span>{note.author || 'Anonymous'}</span>
                                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No items in today&apos;s agenda yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* General Meeting Notes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setGeneralNotesCollapsed(!generalNotesCollapsed)}>
              <MessageSquare className="w-5 h-5" />
              <CardTitle className="flex items-center gap-2">
                General Meeting Notes
                {generalNotesCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </CardTitle>
            </div>
            <Button onClick={saveAllNotes} variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save All Notes
            </Button>
          </div>
          <CardDescription>
            Additional notes, action items, and decisions made
          </CardDescription>
        </CardHeader>
        {!generalNotesCollapsed && (
          <CardContent>
            <Textarea
              value={generalNotes}
              onChange={(e) => updateGeneralNotes(e.target.value)}
              placeholder="Add general meeting notes, action items, decisions..."
              className="min-h-[120px]"
            />
          </CardContent>
        )}
      </Card>

      <AddIssuesDialog
        isOpen={showAddIssuesDialog}
        onClose={handleAddIssuesDialogClose}
        onSuccess={refreshMeeting}
        meetingId={meeting.id}
        availableIssues={availableIssues}
        currentIssueIds={meeting.meetingItems.map(item => item.issueId)}
      />
    </>
  )
}