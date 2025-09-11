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
import { ChevronDown, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

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
  resolutionPlan?: string | null
  workPerformed?: string | null
  roadblocks?: string | null
  usersInvolved?: string | null
  additionalHelp?: string | null
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

export function IssueForm({ categories, issue, isEditing = false }: IssueFormProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState(issue?.categoryId || "none")
  const [selectedPriority, setSelectedPriority] = useState(issue?.priority || "MEDIUM")
  const [selectedStatus, setSelectedStatus] = useState(issue?.status || "OPEN")
  
  // Collapsible sections state - expand if there's existing content or if editing
  const [showResolutionPlan, setShowResolutionPlan] = useState(isEditing && !!issue?.resolutionPlan)
  const [showWorkPerformed, setShowWorkPerformed] = useState(isEditing && !!issue?.workPerformed)
  const [showRoadblocks, setShowRoadblocks] = useState(isEditing && !!issue?.roadblocks)
  const [showUsersInvolved, setShowUsersInvolved] = useState(isEditing && !!issue?.usersInvolved)
  const [showAdditionalHelp, setShowAdditionalHelp] = useState(isEditing && !!issue?.additionalHelp)
  const [showCmicTicket, setShowCmicTicket] = useState(isEditing && !!issue?.cmicTicketNumber)

  const action = isEditing && issue 
    ? (prevState: any, formData: FormData) => updateIssue(issue.id, prevState, formData)
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Label htmlFor="title">Issue Title *</Label>
          <Input
            id="title"
            name="title"
            placeholder="Brief description of the ERP issue"
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

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Problem Description</CardTitle>
            <CardDescription>
              Detailed description of the ERP integration issue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              name="description"
              placeholder="Describe the problem in detail, including any error messages, affected systems, business impact, etc."
              defaultValue={issue?.description || ""}
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader 
            className="pb-3 cursor-pointer hover:bg-muted/50 rounded-t-lg transition-colors"
            onClick={() => setShowResolutionPlan(!showResolutionPlan)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {showResolutionPlan ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  Resolution Plan
                  {!showResolutionPlan && issue?.resolutionPlan && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Has content
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Planned approach to resolve this issue
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {showResolutionPlan && (
            <CardContent>
              <Textarea
                name="resolutionPlan"
                placeholder="Outline the steps planned to resolve this issue, including timelines, resources needed, etc."
                defaultValue={issue?.resolutionPlan || ""}
                rows={4}
              />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader 
            className="pb-3 cursor-pointer hover:bg-muted/50 rounded-t-lg transition-colors"
            onClick={() => setShowWorkPerformed(!showWorkPerformed)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {showWorkPerformed ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  Work Performed
                  {!showWorkPerformed && issue?.workPerformed && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Has content
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Documentation of work already completed
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {showWorkPerformed && (
            <CardContent>
              <Textarea
                name="workPerformed"
                placeholder="Document what work has already been done to address this issue, including troubleshooting steps, tests performed, etc."
                defaultValue={issue?.workPerformed || ""}
                rows={4}
              />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader 
            className="pb-3 cursor-pointer hover:bg-muted/50 rounded-t-lg transition-colors"
            onClick={() => setShowRoadblocks(!showRoadblocks)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {showRoadblocks ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  Roadblocks & Challenges
                  {!showRoadblocks && issue?.roadblocks && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      Has content
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Any obstacles preventing resolution
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {showRoadblocks && (
            <CardContent>
              <Textarea
                name="roadblocks"
                placeholder="Describe any roadblocks, dependencies, or challenges that are preventing or delaying the resolution of this issue."
                defaultValue={issue?.roadblocks || ""}
                rows={4}
              />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader 
            className="pb-3 cursor-pointer hover:bg-muted/50 rounded-t-lg transition-colors"
            onClick={() => setShowUsersInvolved(!showUsersInvolved)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {showUsersInvolved ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  Users Involved
                  {!showUsersInvolved && issue?.usersInvolved && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      Has content
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Stakeholders and team members involved
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {showUsersInvolved && (
            <CardContent>
              <Textarea
                name="usersInvolved"
                placeholder="List the users, teams, or stakeholders involved in this issue - both those affected and those working on the resolution."
                defaultValue={issue?.usersInvolved || ""}
                rows={3}
              />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader 
            className="pb-3 cursor-pointer hover:bg-muted/50 rounded-t-lg transition-colors"
            onClick={() => setShowAdditionalHelp(!showAdditionalHelp)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {showAdditionalHelp ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  Additional Help Needed
                  {!showAdditionalHelp && issue?.additionalHelp && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      Has content
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Areas requiring collaboration with Accounting department
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {showAdditionalHelp && (
            <CardContent>
              <Textarea
                name="additionalHelp"
                placeholder="Describe any areas where assistance from the Accounting department is needed to resolve this issue."
                defaultValue={issue?.additionalHelp || ""}
                rows={3}
              />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader 
            className="pb-3 cursor-pointer hover:bg-muted/50 rounded-t-lg transition-colors"
            onClick={() => setShowCmicTicket(!showCmicTicket)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {showCmicTicket ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  CMiC Support Ticket
                  {!showCmicTicket && issue?.cmicTicketNumber && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      #{issue.cmicTicketNumber}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Track CMiC support ticket for this issue
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {showCmicTicket && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cmicTicketNumber">Ticket Number</Label>
                  <Input
                    id="cmicTicketNumber"
                    name="cmicTicketNumber"
                    placeholder="e.g., 12345"
                    defaultValue={issue?.cmicTicketNumber || ""}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cmicTicketOpened">Date Opened</Label>
                  <Input
                    id="cmicTicketOpened"
                    name="cmicTicketOpened"
                    type="date"
                    defaultValue={issue?.cmicTicketOpened ? new Date(issue.cmicTicketOpened).toISOString().split('T')[0] : ""}
                    className="mt-1"
                  />
                </div>
              </div>
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="cmicTicketClosed"
                    name="cmicTicketClosed"
                    defaultChecked={issue?.cmicTicketClosed || false}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="cmicTicketClosed">Ticket is closed/resolved</Label>
                </div>
              )}
            </CardContent>
          )}
        </Card>
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