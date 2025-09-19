"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Clock, Flag, Plus, X, Edit3, Trash2, AlertTriangle, CheckCircle2, Archive, Undo2 } from "lucide-react"
import { format, parseISO, differenceInDays } from "date-fns"

interface ActionItem {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: number
  dueDate?: string
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

interface NewActionItem {
  title: string
  description: string
  priority: number
  dueDate: string
}

function getPriorityColor(priority: number) {
  switch (priority) {
    case 3: return "bg-red-100 border-red-300 text-red-800"
    case 2: return "bg-orange-100 border-orange-300 text-orange-800"
    case 1: return "bg-yellow-100 border-yellow-300 text-yellow-800"
    default: return "bg-gray-100 border-gray-300 text-gray-800"
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

export default function ActionItemsPage() {
  const [managedItems, setManagedItems] = useState<ActionItem[]>([])
  const [availableItems, setAvailableItems] = useState<ActionItem[]>([])
  const [completedItems, setCompletedItems] = useState<ActionItem[]>([])
  const [archivedItems, setArchivedItems] = useState<ActionItem[]>([])
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
        const items = await response.json()
        console.log('All loaded items:', items)
        console.log('Items with issueId:', items.filter((item: ActionItem) => item.issueId))
        console.log('Items without issueId:', items.filter((item: ActionItem) => !item.issueId))
        
        const today = new Date()
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        
        // Separate managed items (moved from issues or created standalone) from available items (still linked to issues)
        const allManaged = items.filter((item: ActionItem) => !item.issueId && (item.originalIssueId || !item.originalIssueId))
        const available = items.filter((item: ActionItem) => item.issueId)
        
        // Further separate managed items by completion status and date
        const activeManaged = allManaged.filter((item: ActionItem) => !item.completed)
        const completedManaged = allManaged.filter((item: ActionItem) => {
          if (!item.completed) return false
          const updatedDate = parseISO(item.updatedAt)
          return updatedDate >= thirtyDaysAgo
        })
        const archivedManaged = allManaged.filter((item: ActionItem) => {
          if (!item.completed) return false
          const updatedDate = parseISO(item.updatedAt)
          return updatedDate < thirtyDaysAgo
        })
        
        setManagedItems(activeManaged)
        setAvailableItems(available)
        setCompletedItems(completedManaged)
        setArchivedItems(archivedManaged)
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
        const createdItem = await response.json()
        setManagedItems([...managedItems, createdItem])
        setNewItem({ title: "", description: "", priority: 0, dueDate: "" })
        setShowNewItemForm(false)
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
        // Reload all items to properly categorize them
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

  const handleDeleteItem = async (id: string, item?: ActionItem) => {
    try {
      // If item has an issueId or originalIssueId, restore it to available instead of deleting
      if (item?.originalIssueId) {
        await handleRestoreToAvailable(item)
        return
      }
      
      // Only permanently delete items that were manually created (no issue)
      const response = await fetch(`/api/action-items/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Reload all items to update all categories
        loadActionItems()
      }
    } catch (error) {
      console.error('Error deleting action item:', error)
    }
  }

  const handleRestoreToAvailable = async (item: ActionItem) => {
    const restoreId = item.originalIssueId || item.issue?.id;
    if (!restoreId) return

    try {
      // Restore the original issueId to move it back to available items
      await handleUpdateItem(item.id, {
        issueId: restoreId,
        originalIssueId: null
      })
    } catch (error) {
      console.error('Error restoring item to available:', error)
    }
  }

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result
    
    console.log('Drag end:', { destination, source, draggableId })
    
    if (!destination) {
      console.log('No destination, cancelling drag')
      return
    }
    
    // Moving from available to managed
    if (source.droppableId === 'available' && destination.droppableId === 'managed') {
      console.log('Moving from available to managed')
      const item = availableItems.find(item => item.id === draggableId)
      console.log('Found item:', item)
      if (item) {
        try {
          console.log('Moving item to managed, preserving original issue link')
          // Set originalIssueId to preserve the link, then remove issueId to make it managed
          await handleUpdateItem(item.id, {
            issueId: null,
            originalIssueId: item.issueId || item.originalIssueId
          })
          console.log('Update successful')
        } catch (error) {
          console.error('Error moving item to managed:', error)
          // Reload items to ensure consistency
          loadActionItems()
        }
      } else {
        console.error('Item not found in availableItems')
      }
    }
    
    // Moving from completed back to managed
    if (source.droppableId === 'completed' && destination.droppableId === 'managed') {
      const item = completedItems.find(item => item.id === draggableId)
      if (item) {
        try {
          // Mark as incomplete and remove issueId to make it a managed item
          await handleUpdateItem(item.id, { completed: false, issueId: null })
        } catch (error) {
          console.error('Error restoring item to managed:', error)
          loadActionItems()
        }
      }
    }

    // Moving from managed to completed
    if (source.droppableId === 'managed' && destination.droppableId === 'completed') {
      const item = managedItems.find(item => item.id === draggableId)
      if (item) {
        try {
          // Mark as completed
          await handleUpdateItem(item.id, { completed: true })
        } catch (error) {
          console.error('Error marking item as completed:', error)
          loadActionItems()
        }
      }
    }

    // Reordering within managed (local only, no API call needed)
    if (source.droppableId === 'managed' && destination.droppableId === 'managed') {
      const newItems = Array.from(managedItems)
      const [reorderedItem] = newItems.splice(source.index, 1)
      newItems.splice(destination.index, 0, reorderedItem)
      setManagedItems(newItems)
    }
  }

  const ActionItemCard = ({ item, index, isManaged }: { item: ActionItem, index: number, isManaged: boolean }) => {
    const dueDateStatus = getDueDateStatus(item.dueDate)
    const isEditing = editingItem === item.id
    
    return (
      <Draggable draggableId={item.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`
              p-3 border rounded-lg bg-white shadow-sm transition-all
              ${snapshot.isDragging ? 'shadow-lg rotate-1' : ''}
              ${item.completed ? 'opacity-60' : ''}
              ${dueDateStatus?.status === 'overdue' ? 'border-l-4 border-l-red-500' : ''}
              ${dueDateStatus?.status === 'warning' ? 'border-l-4 border-l-yellow-500' : ''}
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={(checked) => 
                    handleUpdateItem(item.id, { completed: checked as boolean })
                  }
                  className="mt-1"
                />
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
                        className={`font-medium text-sm ${item.completed ? 'line-through' : ''} ${
                          (item.issueId || item.originalIssueId) ? 'cursor-pointer text-blue-700 hover:text-blue-900 hover:underline transition-colors' : ''
                        }`}
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
        )}
      </Draggable>
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

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Action Items Manager</h1>
          <p className="text-muted-foreground">
            Organize and track action items with visual due date warnings
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Action Items Manager */}
          <Card className="h-fit lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>My Action Items</span>
                <Button
                  size="sm"
                  onClick={() => setShowNewItemForm(true)}
                  className="h-8"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </CardTitle>
              <CardDescription>
                Your organized action items with drag-and-drop management
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
              
              <Droppable droppableId="managed">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      min-h-32 space-y-2 p-2 rounded-lg transition-colors
                      ${snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : ''}
                    `}
                  >
                    {managedItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No managed items yet</p>
                        <p className="text-sm">Add new items or drag from available items</p>
                      </div>
                    ) : (
                      managedItems.map((item, index) => (
                        <ActionItemCard key={item.id} item={item} index={index} isManaged={true} />
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>

          {/* Available Items */}
          <Card className="h-fit lg:col-span-2">
            <CardHeader>
              <CardTitle>Available from Issues</CardTitle>
              <CardDescription>
                Action items from other parts of the app - drag to organize
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Droppable droppableId="available">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-32 space-y-2"
                  >
                    {availableItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No available items</p>
                        <p className="text-sm">Action items from issues will appear here</p>
                      </div>
                    ) : (
                      availableItems.map((item, index) => (
                        <ActionItemCard key={item.id} item={item} index={index} isManaged={false} />
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>
        </div>

        {/* Completed and Archived Items - Bottom Row */}
        <div className="grid lg:grid-cols-5 gap-6 mt-6">
          {/* Recently Completed Items */}
          <Card className="h-fit lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Recently Completed
              </CardTitle>
              <CardDescription>
                Completed action items from the last 30 days ({completedItems.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Droppable droppableId="completed">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      space-y-2 max-h-64 overflow-y-auto transition-colors
                      ${snapshot.isDraggingOver ? 'bg-green-50 border-2 border-green-200 border-dashed rounded-lg p-2' : ''}
                    `}
                  >
                    {completedItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No recently completed items</p>
                        <p className="text-xs mt-1">Drag items here to mark as complete, or drag completed items back to active</p>
                      </div>
                    ) : (
                      completedItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                p-3 border rounded-lg bg-green-50 border-green-200 transition-all
                                ${snapshot.isDragging ? 'shadow-lg rotate-1' : ''}
                              `}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-1">
                                    <h4
                                      className={`font-medium text-sm line-through text-green-800 ${
                                        (item.issueId || item.originalIssueId) ? 'cursor-pointer hover:text-blue-600 hover:underline transition-colors' : ''
                                      }`}
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
                                  {item.description && (
                                    <p className="text-xs text-green-600 mt-1">{item.description}</p>
                                  )}
                                  
                                  <div className="flex items-center gap-3 mt-2">
                                    <div className={`text-xs px-2 py-1 rounded border ${getPriorityColor(item.priority)}`}>
                                      <Flag className="w-3 h-3 inline mr-1" />
                                      {getPriorityLabel(item.priority)}
                                    </div>
                                    
                                    <div className="text-xs text-green-600 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Completed {format(parseISO(item.updatedAt), 'MMM d')}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleUpdateItem(item.id, { completed: false })}
                                    className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                                    title="Mark as incomplete"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteItem(item.id, item)}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>

          {/* Archived Items */}
          <Card className="h-fit lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-gray-600" />
                Archived Items
              </CardTitle>
              <CardDescription>
                Items completed more than 30 days ago ({archivedItems.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {archivedItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Archive className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No archived items</p>
                  </div>
                ) : (
                  archivedItems.map((item) => (
                    <div key={item.id} className="p-3 border rounded-lg bg-gray-50 border-gray-200 opacity-75">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <h4
                              className={`font-medium text-sm line-through text-gray-700 ${
                                (item.issueId || item.originalIssueId) ? 'cursor-pointer hover:text-blue-600 hover:underline transition-colors' : ''
                              }`}
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
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                          )}
                          
                          <div className="flex items-center gap-3 mt-2">
                            <div className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600">
                              <Archive className="w-3 h-3 inline mr-1" />
                              Archived
                            </div>
                            
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(parseISO(item.updatedAt), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteItem(item.id, item)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                          title="Delete permanently"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DragDropContext>
  )
}