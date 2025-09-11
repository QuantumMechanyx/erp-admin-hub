"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { MessageSquare, User, Calendar, Filter } from "lucide-react"
import { formatDistanceToNowPacific } from "@/lib/timezone"

type Issue = {
  id: string
  title: string
  description?: string | null
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
  assignedTo?: string | null
  createdAt: Date
  updatedAt: Date
  category?: { name: string; color?: string } | null
  notes: Array<{ id: string; content: string; createdAt: Date }>
  _count: { notes: number }
}

type Category = {
  id: string
  name: string
  _count: { issues: number }
}

interface IssuesListProps {
  issues: Issue[]
  categories: Category[]
  showCreateButton?: boolean
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

export function IssuesList({ issues, categories, showCreateButton = true }: IssuesListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter
    const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter
    const matchesCategory = categoryFilter === "all" || issue.category?.name === categoryFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory
  })

  if (issues.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No issues found</p>
        {showCreateButton && (
          <Button asChild>
            <Link href="/dashboard/new">Create your first issue</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name} ({category._count.issues})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredIssues.map(issue => (
          <Card key={issue.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/dashboard/${issue.id}`}
                      className="text-lg font-semibold hover:underline"
                    >
                      {issue.title}
                    </Link>
                    {issue.category && (
                      <Badge variant="outline" className="text-xs">
                        {issue.category.name}
                      </Badge>
                    )}
                  </div>
                  {issue.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {issue.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <Badge className={priorityColors[issue.priority]}>
                      {issue.priority}
                    </Badge>
                    <Badge className={statusColors[issue.status]}>
                      {issue.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  {issue.assignedTo && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {issue.assignedTo}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {issue._count.notes} notes
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Updated {formatDistanceToNowPacific(issue.updatedAt)}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/${issue.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredIssues.length === 0 && issues.length > 0 && (
        <div className="text-center py-8">
          <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No issues match your current filters</p>
        </div>
      )}
    </div>
  )
}