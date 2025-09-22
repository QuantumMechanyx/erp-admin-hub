"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Flag, Plus, Edit3, Trash2, AlertTriangle, CheckCircle2, Undo2, GripVertical } from "lucide-react"
import { format, parseISO, differenceInDays } from "date-fns"

interface ActionItem {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: number
  dueDate?: string
  order: number
  createdAt: string
  updatedAt: string
  issueId?: string
  originalIssueId?: string
  issue?: {
    id: string
    title: string
    description?: string
    category?: {
      name: string
      color?: string
    }
  }
  originalIssue?: {
    id: string
    title: string
    description?: string
    category?: {
      name: string
      color?: string
    }
  }
}

interface IssueWithActionItems {
  id: string
  title: string
  description?: string
  actionItemsText: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
  createdAt: string
  updatedAt: string
  category?: {
    name: string
    color?: string
  }
}

interface NewActionItem {
  title: string
  description: string
  priority: number
  dueDate: string
}

function getPriorityColor(priority: number) {
  switch (priority) {
    case 3: return "bg-red-100 border-red-500 text-red-800"
    case 2: return "bg-yellow-100 border-yellow-500 text-yellow-800"
    case 1: return "bg-yellow-100 border-yellow-500 text-yellow-800"
    default: return "bg-gray-100 border-gray-300 text-gray-800"
  }
}

function getPriorityBorderColor(priority: number) {
  switch (priority) {
    case 3: return "border-l-red-500"
    case 2: return "border-l-yellow-500"
    case 1: return "border-l-yellow-500"
    default: return "border-l-gray-300"
  }
}

function getPriorityLabel(priority: number) {
  switch (priority) {
    case 3: return "High"
    case 2: return "Medium"
    case 1: return "Low"
    default: return "None"
  }
}

function getDueDateStatus(dueDate?: string) {
  if (!dueDate) return null

  const today = new Date()
  const due = parseISO(dueDate)
  const daysLeft = differenceInDays(due, today)

  if (daysLeft < 0) {
    return { status: "overdue", label: `${Math.abs(daysLeft)} days overdue`, color: "text-red-600" }
  } else if (daysLeft === 0) {
    return { status: "today", label: "Due today", color: "text-orange-600" }
  } else if (daysLeft <= 3) {
    return { status: "warning", label: `${daysLeft} days left`, color: "text-yellow-600" }
  } else {
    return { status: "normal", label: `${daysLeft} days left`, color: "text-gray-600" }
  }
}

function getIssuePriorityNumber(priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT") {
  switch (priority) {
    case "URGENT": return 3
    case "HIGH": return 2
    case "MEDIUM": return 1
    case "LOW": return 0
    default: return 0
  }
}

const statusColors = {
  OPEN: "bg-orange-100 text-orange-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800"
}

export default function ActionItemsPage() {
  const [allItems, setAllItems] = useState<ActionItem[]>([])
  const [issuesWithActionItems, setIssuesWithActionItems] = useState<IssueWithActionItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newItem, setNewItem] = useState<NewActionItem>({
    title: "",
    description: "",
    priority: 0,
    dueDate: ""
  })
  const [showNewItemForm, setShowNewItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    loadActionItems()
  }, [])

  const loadActionItems = async () => {
    try {
      const response = await fetch('/api/action-items')
      if (response.ok) {
        const data = await response.json()
        console.log('All loaded data:', data)
        console.log('Sample action item structure:', data.actionItems?.[0])

        const items = data.actionItems || []
        const issues = data.issuesWithActionItems || []

        // Filter out completed items older than 7 days and delete them
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const itemsToDelete = items.filter((item: ActionItem) => {
          if (!item.completed) return false
          const updatedDate = parseISO(item.updatedAt)
          return updatedDate < sevenDaysAgo
        })

        // Delete old completed items
        for (const item of itemsToDelete) {
          await fetch(`/api/action-items/${item.id}`, { method: 'DELETE' })
        }

        // Filter to keep only non-deleted items
        const activeItems = items.filter((item: ActionItem) => {
          if (!item.completed) return true
          const updatedDate = parseISO(item.updatedAt)
          return updatedDate >= sevenDaysAgo
        })

        setAllItems(activeItems)
        setIssuesWithActionItems(issues)
      }
    } catch (error) {
      console.error('Error loading action items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateItem = async () => {
    if (!newItem.title.trim()) return

    try {
      const response = await fetch('/api/action-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      })

      if (response.ok) {
        setNewItem({ title: "", description: "", priority: 0, dueDate: "" })
        setShowNewItemForm(false)
        loadActionItems()
      }
    } catch (error) {
      console.error('Error creating action item:', error)
    }
  }

  const handleUpdateItem = async (id: string, updates: Partial<ActionItem>) => {
    try {
      console.log('Updating item:', id, 'with updates:', updates)
      const response = await fetch(`/api/action-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        console.log('Response OK, reloading items')
        const result = await response.json()
        console.log('Updated item result:', result)
        loadActionItems()
        setEditingItem(null)
        setEditingNote(prev => ({ ...prev, [id]: "" }))
      } else {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error updating action item:', error)
    }
  }

  const handleRestoreToAvailable = async (item: ActionItem) => {
    try {
      const response = await fetch(`/api/action-items/${item.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadActionItems()
      }
    } catch (error) {
      console.error('Error restoring action item:', error)
    }
  }

  const handleDeleteItem = async (id: string, item?: ActionItem) => {
    try {
      if (item?.originalIssueId) {
        await handleRestoreToAvailable(item)
        return
      }

      const response = await fetch(`/api/action-items/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadActionItems()
      }
    } catch (error) {
      console.error('Error deleting action item:', error)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: any) => {
    console.log("🚀 DND-KIT DRAG START - Event:", event)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    console.log("🎯 DND-KIT DRAG END - Event:", event)

    if (!over || active.id === over.id) {
      console.log("❌ DND-KIT - No change needed")
      return
    }

    console.log("📍 DND-KIT - Moving:", active.id, "to position of:", over.id)

    // Check if we're reordering action items
    const activeItems = allItems.filter(item => !item.completed)
    const oldIndex = activeItems.findIndex(item => item.id === active.id)
    const newIndex = activeItems.findIndex(item => item.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      // Reordering action items
      console.log("📍 DND-KIT - Reordering action items - Old index:", oldIndex, "New index:", newIndex)

      const newItems = arrayMove(activeItems, oldIndex, newIndex)

      const allItemsUpdated = [
        ...newItems,
        ...allItems.filter(item => item.completed)
      ]
      setAllItems(allItemsUpdated)

      const reorderedItems = newItems.map((item, index) => ({
        id: item.id,
        order: index
      }))

      try {
        const response = await fetch('/api/action-items', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reorderedItems }),
        })

        if (!response.ok) {
          console.error('Failed to save new order')
          loadActionItems()
        } else {
          console.log("✅ DND-KIT - Action item order saved successfully")
        }
      } catch (error) {
        console.error('Error saving new order:', error)
        loadActionItems()
      }
      return
    }

    // Check if we're reordering issues with action items
    const oldIssueIndex = issuesWithActionItems.findIndex(issue => issue.id === active.id)
    const newIssueIndex = issuesWithActionItems.findIndex(issue => issue.id === over.id)

    if (oldIssueIndex !== -1 && newIssueIndex !== -1) {
      // Reordering issues (frontend only - no persistence to database)
      console.log("📍 DND-KIT - Reordering issues - Old index:", oldIssueIndex, "New index:", newIssueIndex)

      const newIssues = arrayMove(issuesWithActionItems, oldIssueIndex, newIssueIndex)
      setIssuesWithActionItems(newIssues)
      console.log("✅ DND-KIT - Issue order updated (frontend only)")
    }
  }

  const ActionItemCard = ({ item, isManaged }: { item: ActionItem, isManaged: boolean }) => {
    const dueDateStatus = getDueDateStatus(item.dueDate)
    const isEditing = editingItem === item.id

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-3 border rounded-lg bg-white shadow-sm transition-all border-l-4 ${isDragging ? 'shadow-lg rotate-1 scale-105 z-50' : ''} ${getPriorityBorderColor(item.priority)}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 -m-1 hover:bg-gray-100 rounded"
              title="Drag to reorder"
              onMouseDown={() => console.log("🖱️ Mouse down on grip handle for item:", item.id)}
              onTouchStart={() => console.log("👆 Touch start on grip handle for item:", item.id)}
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editingNote[item.id] || item.title}
                  onChange={(e) => setEditingNote(prev => ({ ...prev, [item.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateItem(item.id, { title: editingNote[item.id] || item.title })
                    }
                    if (e.key === 'Escape') {
                      setEditingItem(null)
                      setEditingNote(prev => ({ ...prev, [item.id]: "" }))
                    }
                  }}
                  className="text-sm"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-1">
                  <h4
                    className={`font-medium text-sm ${(item.issueId || item.originalIssueId) ? 'cursor-pointer text-blue-700 hover:text-blue-900 hover:underline transition-colors' : ''}`}
                    onClick={(e) => {
                      const linkedIssueId = item.issueId || item.originalIssueId;
                      if (linkedIssueId) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(`/dashboard/${linkedIssueId}`, '_blank');
                      }
                    }}
                    title={
                      (item.issueId || item.originalIssueId) ?
                      `Click to open issue in new tab: ${item.issue?.title || item.originalIssue?.title || 'Related Issue'}` :
                      (item.description || undefined)
                    }
                  >
                    {item.title}
                  </h4>
                  {(item.issueId || item.originalIssueId) && (
                    <span className="text-blue-500 text-xs" title="Linked to an issue">🔗</span>
                  )}
                </div>
              )}

              {item.description && (
                <p className="text-xs text-gray-600 mt-1">{item.description}</p>
              )}

              {(item.issue || item.originalIssue) && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-gray-500">From:</span>
                  <span className="text-xs font-medium text-blue-600 cursor-pointer hover:underline"
                    onClick={() => window.open(`/dashboard/${item.issueId || item.originalIssueId}`, '_blank')}
                    title="Click to open issue">{item.issue?.title || item.originalIssue?.title}</span>
                  {(item.issue?.category || item.originalIssue?.category) && (
                    <span
                      className="text-xs px-1 py-0.5 rounded"
                      style={{ backgroundColor: (item.issue?.category?.color || item.originalIssue?.category?.color) + '20' }}
                    >
                      {item.issue?.category?.name || item.originalIssue?.category?.name}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 mt-2">
                <div className={`text-xs px-2 py-1 rounded border ${getPriorityColor(item.priority)}`}>
                  <Flag className="w-3 h-3 inline mr-1" />
                  {getPriorityLabel(item.priority)}
                </div>

                {item.dueDate && (
                  <div className={`text-xs flex items-center gap-1 ${dueDateStatus?.color}`}>
                    <Calendar className="w-3 h-3" />
                    {format(parseISO(item.dueDate), 'MMM d')}
                    {dueDateStatus?.status === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                  </div>
                )}

                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(parseISO(item.createdAt), 'MMM d')}
                </div>
              </div>
            </div>
          </div>

          {isManaged && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteItem(item.id, item)}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                title="Mark as completed"
              >
                <CheckCircle2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingItem(item.id)
                  setEditingNote(prev => ({ ...prev, [item.id]: item.title }))
                }}
                className="h-6 w-6 p-0"
                title="Edit item"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              {item.issue && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRestoreToAvailable(item)}
                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                  title="Restore to Available from Issues"
                >
                  <Undo2 className="w-3 h-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteItem(item.id, item)}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                title="Remove from manager (restores to available if from issue)"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const IssueActionItemCard = ({ issue }: { issue: IssueWithActionItems }) => {
    const priorityNumber = getIssuePriorityNumber(issue.priority)
    const [isCompleted, setIsCompleted] = useState(false)

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: issue.id })

    const handleComplete = async (completed: boolean) => {
      if (completed) {
        setIsCompleted(true)
        setTimeout(() => {
          loadActionItems()
        }, 500)
      }
    }

    if (isCompleted) {
      return null
    }

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-3 border rounded-lg bg-white shadow-sm transition-all border-l-4 ${isDragging ? 'shadow-lg rotate-1 scale-105 z-50' : ''} ${getPriorityBorderColor(priorityNumber)}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 -m-1 hover:bg-gray-100 rounded"
              title="Drag to reorder"
              onMouseDown={() => console.log("🖱️ Mouse down on issue grip handle for:", issue.id)}
              onTouchStart={() => console.log("👆 Touch start on issue grip handle for:", issue.id)}
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4
                  className="font-medium text-sm cursor-pointer text-blue-700 hover:text-blue-900 hover:underline transition-colors"
                  onClick={() => window.open(`/dashboard/${issue.id}`, '_blank')}
                  title={`Click to open issue in new tab: ${issue.title}`}
                >
                  {issue.title}
                </h4>
                {issue.category && (
                  <span
                    className="text-xs px-1 py-0.5 rounded"
                    style={{ backgroundColor: (issue.category.color || '#gray') + '20' }}
                  >
                    {issue.category.name}
                  </span>
                )}
              </div>

              <div
                className="prose prose-sm max-w-none text-xs text-gray-700 mb-2 [&_p]:mb-1 [&_p:last-child]:mb-0"
                dangerouslySetInnerHTML={{ __html: issue.actionItemsText }}
              />

              <div className="flex items-center gap-3">
                <div className={`text-xs px-2 py-1 rounded border ${getPriorityColor(priorityNumber)}`}>
                  <Flag className="w-3 h-3 inline mr-1" />
                  {issue.priority}
                </div>

                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Updated {format(parseISO(issue.updatedAt), 'MMM d')}
                </div>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleComplete(true)}
            className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
            title="Mark as completed"
          >
            <CheckCircle2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading action items...</p>
        </div>
      </div>
    )
  }

  const activeItems = allItems.filter(item => !item.completed)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Action Items Manager</h1>
          <p className="text-muted-foreground">
            Organize and track all your action items in one place. Completed items older than 7 days are automatically removed.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Action Items</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    const testItem = {
                      title: "Test Action Item " + Math.floor(Math.random() * 1000),
                      description: "This is a test item for drag and drop",
                      priority: 1,
                      dueDate: null
                    }

                    const response = await fetch('/api/action-items', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(testItem)
                    })

                    if (response.ok) {
                      loadActionItems()
                    }
                  }}
                  variant="outline"
                  className="h-8"
                >
                  Add Test Item
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowNewItemForm(true)}
                  className="h-8"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              All your action items. Drag by the grip handle to reorder, or use the completion button to mark as done.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showNewItemForm && (
              <div className="mb-4 p-3 border rounded-lg bg-gray-50">
                <Input
                  placeholder="Action item title..."
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="mb-2"
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="mb-2 h-20"
                />
                <div className="flex gap-2 mb-2">
                  <select
                    value={newItem.priority}
                    onChange={(e) => setNewItem({ ...newItem, priority: parseInt(e.target.value) })}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value={0}>No Priority</option>
                    <option value={1}>Low Priority</option>
                    <option value={2}>Medium Priority</option>
                    <option value={3}>High Priority</option>
                  </select>
                  <Input
                    type="date"
                    value={newItem.dueDate}
                    onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateItem}>
                    Add Item
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowNewItemForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {/* Individual Action Items */}
              {activeItems.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Individual Action Items</h3>
                  <SortableContext items={activeItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {activeItems.map((item) => (
                        <ActionItemCard key={item.id} item={item} isManaged={true} />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )}

              {/* Issues with Rich Text Action Items */}
              {issuesWithActionItems.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Action Items from Issues</h3>
                  <p className="text-xs text-gray-500 mb-2">Note: Order changes are temporary and reset on page reload</p>
                  <SortableContext items={issuesWithActionItems.map(issue => issue.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {issuesWithActionItems.map((issue) => (
                        <IssueActionItemCard key={issue.id} issue={issue} />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )}

              {activeItems.length === 0 && issuesWithActionItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No action items yet</p>
                  <p className="text-sm">Add new items or create them from issues in the Working Interface</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DndContext>
  )
}