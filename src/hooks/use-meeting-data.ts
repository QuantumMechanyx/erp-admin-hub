"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"

type ActionItemFormData = {
  title: string
  description: string
  priority: number
  dueDate: string
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
      additionalHelpNotes?: any[]
      actionItems?: any[]
      notes?: any[]
      priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
      status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
      category?: { name: string } | null
    }
  }[]
}

export function useMeetingData(initialMeeting: Meeting) {
  const router = useRouter()
  const [meeting, setMeeting] = useState<Meeting>(initialMeeting)
  const [generalNotes, setGeneralNotes] = useState(initialMeeting.generalNotes || "")
  const [itemDiscussionNotes, setItemDiscussionNotes] = useState<Record<string, string>>(
    Object.fromEntries(
      initialMeeting.meetingItems.map(item => [item.issueId, item.discussionNotes || ""])
    )
  )
  const [showActionItemForm, setShowActionItemForm] = useState<Record<string, boolean>>({})

  const refreshMeeting = useCallback(() => {
    console.log("refreshMeeting called - triggering window.location.reload()")
    window.location.reload()
  }, [])

  const updateMeetingData = useCallback((newMeeting: Meeting) => {
    setMeeting(newMeeting)
    setGeneralNotes(newMeeting.generalNotes || "")
    setItemDiscussionNotes(
      Object.fromEntries(
        newMeeting.meetingItems.map(item => [item.issueId, item.discussionNotes || ""])
      )
    )
  }, [])

  const toggleActionItemForm = useCallback((issueId: string) => {
    setShowActionItemForm(prev => ({
      ...prev,
      [issueId]: !prev[issueId]
    }))
  }, [])

  const createActionItem = useCallback(async (issueId: string, actionItemData: ActionItemFormData) => {
    const response = await fetch('/api/action-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        issueId,
        title: actionItemData.title,
        description: actionItemData.description || null,
        priority: actionItemData.priority,
        dueDate: actionItemData.dueDate || null
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create action item')
    }

    // Close the form
    setShowActionItemForm(prev => ({
      ...prev,
      [issueId]: false
    }))

    // Refresh to show new data
    refreshMeeting()
  }, [refreshMeeting])

  return {
    meeting,
    generalNotes,
    setGeneralNotes,
    itemDiscussionNotes,
    setItemDiscussionNotes,
    showActionItemForm,
    toggleActionItemForm,
    createActionItem,
    refreshMeeting,
    updateMeetingData
  }
}