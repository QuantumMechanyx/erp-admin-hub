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
import { RichTextEditor } from "./rich-text-editor"

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
  actionItemsText?: string | null
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
  categoryId?: string | null
  assignedTo?: string | null
}

interface IssueFormProps {
  categories: Category[]
  issue?: Issue
  isEditing?: boolean
}

export function IssueFormSimple({ categories, issue, isEditing = false }: IssueFormProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState(issue?.categoryId || "none")
  const [selectedPriority, setSelectedPriority] = useState(issue?.priority || "MEDIUM")
  const [selectedStatus, setSelectedStatus] = useState(issue?.status || "OPEN")
  const [actionItemsContent, setActionItemsContent] = useState(issue?.actionItemsText || "")

  const action = isEditing && issue
    ? (prevState: unknown, formData: FormData) => updateIssue(issue.id, prevState, formData)
    : createIssue

  const [state, formAction, isPending] = useActionState(action, { errors: {} })

  // Handle successful issue creation
  useEffect(() => {
    if (state.success && !isEditing) {
      router.push("/dashboard")
    }
  }, [state.success, isEditing, router])

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden inputs to ensure controlled select values are submitted */}
      <input type="hidden" name="priority" value={selectedPriority} />
      <input type="hidden" name="status" value={selectedStatus} />
      <input type="hidden" name="categoryId" value={selectedCategory === "none" ? "" : selectedCategory} />
      <input type="hidden" name="actionItemsText" value={actionItemsContent} />

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

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Provide a detailed description of the issue, including any relevant context, error messages, or business impact. You can also include resolution plans, work performed, roadblocks, or any other relevant information here."
          defaultValue={issue?.description || ""}
          rows={6}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="actionItems">Action Items</Label>
        <p className="text-sm text-muted-foreground mb-2">
          List the specific tasks that need to be completed. Use formatting to organize your action items.
        </p>
        <RichTextEditor
          content={actionItemsContent}
          onChange={setActionItemsContent}
          placeholder="• First action item&#10;• Second action item&#10;• Mark completed items with strikethrough"
        />
      </div>

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