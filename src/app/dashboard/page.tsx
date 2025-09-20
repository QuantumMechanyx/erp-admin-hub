"use client"

import { Suspense, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Plus, ChevronDown, Clock } from "lucide-react"
import Link from "next/link"
import { IssuesList } from "@/components/issues-list"
import { ZendeskTicketsDrawer } from "@/components/zendesk-tickets-drawer"

export default function Dashboard() {
  const [issues, setIssues] = useState([])
  const [resolvedIssues, setResolvedIssues] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [issuesResponse, resolvedResponse, categoriesResponse] = await Promise.all([
        fetch('/api/issues'),
        fetch('/api/issues?status=resolved'),
        fetch('/api/categories')
      ])

      // Check if responses are ok before parsing JSON
      const issuesData = issuesResponse.ok ? await issuesResponse.json() : []
      const resolvedData = resolvedResponse.ok ? await resolvedResponse.json() : []
      const categoriesData = categoriesResponse.ok ? await categoriesResponse.json() : []

      setIssues(issuesData || [])
      setResolvedIssues(resolvedData || [])
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Set empty arrays as fallback
      setIssues([])
      setResolvedIssues([])
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ERP Issues Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and track high-priority ERP integration issues
          </p>
        </div>
        <div className="flex gap-2">
          <ZendeskTicketsDrawer />
          <Button asChild>
            <Link href="/dashboard/categories">
              Manage Categories
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/new">
              <Plus className="w-4 h-4 mr-2" />
              New Issue
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Issues</CardTitle>
          <CardDescription>
            All current ERP issues organized by priority and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading issues...</div>}>
            <IssuesList issues={issues} categories={categories} />
          </Suspense>
        </CardContent>
      </Card>

      <Collapsible defaultOpen={false}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <span>Resolved Issues</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-normal text-muted-foreground">
                    {resolvedIssues.length} resolved
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CardTitle>
              <CardDescription>
                Previously resolved and closed ERP issues
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <Suspense fallback={<div>Loading resolved issues...</div>}>
                <IssuesList issues={resolvedIssues} categories={categories} showCreateButton={false} />
              </Suspense>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}