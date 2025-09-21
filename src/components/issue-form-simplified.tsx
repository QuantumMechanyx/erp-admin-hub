"use client"

import { useActionState } from "react"
import { createIssue, updateIssue } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Calendar } from "lucide-react"

type Category = {
  id: string
  name: string
  description?: string | null
  color?: string | null
}

type Issue = {
  id: string
  title: string
  description?: string | null
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
  categoryId?: string | null
  assignedTo?: string | null
  actionItems?: Array<{
    id: string
    title: string
    description?: string | null
    priority: number
    dueDate?: Date | null
  }>
}

interface ActionItemInput {
  title: string
  description: string
  priority: number
  dueDate: string
}

interface IssueFormProps {
  categories: Category[]
  issue?: Issue
  isEditing?: boolean
}

export function IssueFormSimplified({ categories, issue, isEditing = false }: IssueFormProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState(issue?.categoryId || "none")
  const [selectedPriority, setSelectedPriority] = useState(issue?.priority || "MEDIUM")
  const [selectedStatus, setSelectedStatus] = useState(issue?.status || "OPEN")
  const [actionItems, setActionItems] = useState<ActionItemInput[]>([])
  const [showActionItemForm, setShowActionItemForm] = useState(false)
  const [newActionItem, setNewActionItem] = useState<ActionItemInput>({
    title: "",
    description: "",
    priority: 0,
    dueDate: ""
  })

  const action = isEditing && issue
    ? (prevState: unknown, formData: FormData) => updateIssue(issue.id, prevState, formData)
    : createIssue

  const [state, formAction, isPending] = useActionState(action, { errors: {} })

  // Handle successful issue creation
  useEffect(() => {
    if (state.success && !isEditing) {
      // After creating issue, create action items
      if (state.issue?.id && actionItems.length > 0) {
        createActionItems(state.issue.id)
      } else {
        router.push("/dashboard")
      }
    }
  }, [state.success, isEditing, router])

  const createActionItems = async (issueId: string) => {
    try {
      for (const item of actionItems) {
        await fetch('/api/action-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...item,
            issueId
          })
        })
      }
      router.push("/dashboard")
    } catch (error) {
      console.error('Error creating action items:', error)
      router.push("/dashboard")
    }
  }

  const addActionItem = () => {
    if (newActionItem.title.trim()) {
      setActionItems([...actionItems, { ...newActionItem }])
      setNewActionItem({ title: "", description: "", priority: 0, dueDate: "" })
      setShowActionItemForm(false)
    }
  }

  const removeActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index))
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 3: return "High"
      case 2: return "Medium"
      case 1: return "Low"
      default: return "None"
    }
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return "text-red-600"
      case 2: return "text-orange-600"
      case 1: return "text-yellow-600"
      default: return "text-gray-600"
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden inputs to ensure controlled select values are submitted */}
      <input type="hidden" name="priority" value={selectedPriority} />
      <input type="hidden" name="status" value={selectedStatus} />
      <input type="hidden" name="categoryId" value={selectedCategory === "none" ? "" : selectedCategory} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Label htmlFor="title">Issue Title *</Label>
          <Input
            id="title"
            name="title"
            placeholder="Brief description of the issue"
            defaultValue={issue?.title}
            className="mt-1"
          />
          {state.errors?.title && (
            <p className="text-sm text-red-600 mt-1">{state.errors.title[0]}</p>
          )}
        </div>

        <div>
          <Label htmlFor="priority">Priority *</Label>
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status *</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Category</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="assignedTo">Assigned To</Label>
          <Input
            id="assignedTo"
            name="assignedTo"
            placeholder="Person responsible for this issue"
            defaultValue={issue?.assignedTo || ""}
            className="mt-1"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Description</CardTitle>
          <CardDescription>
            Describe the issue in detail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            name="description"
            placeholder="Provide a detailed description of the issue, including any relevant context, error messages, or business impact. You can also include resolution plans, work performed, roadblocks, or any other relevant information here."
            defaultValue={issue?.description || ""}
            rows={6}
          />
        </CardContent>
      </Card>

      {!isEditing && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Action Items</CardTitle>
                <CardDescription>
                  Add specific tasks that need to be completed for this issue
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowActionItemForm(true)}
                disabled={showActionItemForm}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Action Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showActionItemForm && (
              <div className="mb-4 p-3 border rounded-lg bg-gray-50 space-y-3">
                <div>
                  <Label htmlFor="actionItemTitle">Action Item Title</Label>
                  <Input
                    id="actionItemTitle"
                    placeholder="What needs to be done?"
                    value={newActionItem.title}
                    onChange={(e) => setNewActionItem({ ...newActionItem, title: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="actionItemDescription">Description (optional)</Label>
                  <Textarea
                    id="actionItemDescription"
                    placeholder="Additional details about this action item"
                    value={newActionItem.description}
                    onChange={(e) => setNewActionItem({ ...newActionItem, description: e.target.value })}
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="actionItemPriority">Priority</Label>
                    <Select
                      value={newActionItem.priority.toString()}
                      onValueChange={(value) => setNewActionItem({ ...newActionItem, priority: parseInt(value) })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No Priority</SelectItem>
                        <SelectItem value="1">Low</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="actionItemDueDate">Due Date (optional)</Label>
                    <Input
                      id="actionItemDueDate"
                      type="date"
                      value={newActionItem.dueDate}
                      onChange={(e) => setNewActionItem({ ...newActionItem, dueDate: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={addActionItem}
                    disabled={!newActionItem.title.trim()}
                  >
                    Add to List
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowActionItemForm(false)
                      setNewActionItem({ title: "", description: "", priority: 0, dueDate: "" })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {actionItems.length > 0 ? (
              <div className="space-y-2">
                {actionItems.map((item, index) => (
                  <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.title}</div>
                      {item.description && (
                        <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {getPriorityLabel(item.priority)} Priority
                        </span>
                        {item.dueDate && (
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeActionItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No action items added yet. Click "Add Action Item" to create tasks for this issue.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {state.errors?._form && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{state.errors._form[0]}</p>
        </div>
      )}

      {state.success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-600">
            {isEditing ? "Issue updated successfully!" : "Issue created successfully! Redirecting..."}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending
            ? (isEditing ? "Updating..." : "Creating...")
            : (isEditing ? "Update Issue" : "Create Issue")
          }
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}