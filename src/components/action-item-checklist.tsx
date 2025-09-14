"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, Clock, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ActionItem {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: number
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

interface ActionItemChecklistProps {
  issueId: string
  actionItems: ActionItem[]
}

export function ActionItemChecklist({ issueId, actionItems: initialItems }: ActionItemChecklistProps) {
  const [actionItems, setActionItems] = useState<ActionItem[]>(initialItems)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    priority: 0,
    dueDate: undefined as Date | undefined
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const priorityLabels = {
    0: "Low",
    1: "Medium", 
    2: "High",
    3: "Urgent"
  }

  const priorityColors = {
    0: "bg-gray-100 text-gray-800",
    1: "bg-blue-100 text-blue-800",
    2: "bg-yellow-100 text-yellow-800", 
    3: "bg-red-100 text-red-800"
  }

  const handleToggleComplete = async (itemId: string, completed: boolean) => {
    try {
      setError(null)
      const response = await fetch(`/api/action-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      })

      if (!response.ok) {
        throw new Error('Failed to update action item')
      }

      setActionItems(items => 
        items.map(item => 
          item.id === itemId ? { ...item, completed, updatedAt: new Date() } : item
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update action item')
    }
  }

  const handleAddItem = async () => {
    if (!newItem.title.trim()) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/action-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId,
          title: newItem.title,
          description: newItem.description || null,
          priority: newItem.priority,
          dueDate: newItem.dueDate?.toISOString() || null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create action item')
      }

      const result = await response.json()
      if (result.success) {
        setActionItems(items => [result.actionItem, ...items])
        setNewItem({ title: "", description: "", priority: 0, dueDate: undefined })
        setIsAddingItem(false)
      } else {
        throw new Error(result.error || 'Failed to create action item')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create action item')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      setError(null)
      const response = await fetch(`/api/action-items/${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete action item')
      }

      setActionItems(items => items.filter(item => item.id !== itemId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete action item')
    }
  }

  const completedCount = actionItems.filter(item => item.completed).length
  const totalCount = actionItems.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            Action Items
            {totalCount > 0 && (
              <Badge variant="outline">
                {completedCount}/{totalCount} completed
              </Badge>
            )}
          </div>
          <Button 
            size="sm" 
            onClick={() => setIsAddingItem(true)}
            disabled={isAddingItem}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </CardTitle>
        <CardDescription>
          Track tasks and action items for this issue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {isAddingItem && (
          <div className="p-4 border border-dashed border-gray-300 rounded-lg space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-item-title">Title</Label>
              <Input
                id="new-item-title"
                placeholder="Enter action item title"
                value={newItem.title}
                onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-item-description">Description (optional)</Label>
              <Textarea
                id="new-item-description"
                placeholder="Enter additional details"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={newItem.priority.toString()} 
                  onValueChange={(value) => setNewItem(prev => ({ ...prev, priority: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Low</SelectItem>
                    <SelectItem value="1">Medium</SelectItem>
                    <SelectItem value="2">High</SelectItem>
                    <SelectItem value="3">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-item-due-date">Due Date (optional)</Label>
                <Input
                  id="new-item-due-date"
                  type="date"
                  value={newItem.dueDate ? format(newItem.dueDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => setNewItem(prev => ({ 
                    ...prev, 
                    dueDate: e.target.value ? new Date(e.target.value) : undefined 
                  }))}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddItem} disabled={loading || !newItem.title.trim()}>
                {loading ? "Adding..." : "Add Item"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingItem(false)
                  setNewItem({ title: "", description: "", priority: 0, dueDate: undefined })
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {actionItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No action items yet. Click "Add Item" to create your first action item.
          </div>
        ) : (
          <div className="space-y-3">
            {actionItems.map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                  item.completed ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                )}
              >
                <Checkbox
                  id={`item-${item.id}`}
                  checked={item.completed}
                  onCheckedChange={(checked) => handleToggleComplete(item.id, checked as boolean)}
                  className="mt-1"
                />
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Label 
                      htmlFor={`item-${item.id}`}
                      className={cn(
                        "font-medium cursor-pointer",
                        item.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {item.title}
                    </Label>
                    <Badge className={priorityColors[item.priority as keyof typeof priorityColors]} size="sm">
                      {priorityLabels[item.priority as keyof typeof priorityLabels]}
                    </Badge>
                    {item.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(item.dueDate), "MMM d")}
                        {new Date(item.dueDate) < new Date() && !item.completed && (
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {item.description && (
                    <p className={cn(
                      "text-sm",
                      item.completed ? "text-muted-foreground" : "text-gray-600"
                    )}>
                      {item.description}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}