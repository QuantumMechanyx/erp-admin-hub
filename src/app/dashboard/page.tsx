import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Plus, ChevronDown } from "lucide-react"
import Link from "next/link"
import { getIssues, getResolvedIssues, getCategories } from "@/lib/actions"
import { IssuesList } from "@/components/issues-list"
import { DashboardStats } from "@/components/dashboard-stats"
import { ZendeskTicketsDrawer } from "@/components/zendesk-tickets-drawer"

export const revalidate = 0

export default async function Dashboard() {
  const [issues, resolvedIssues, categories] = await Promise.all([
    getIssues(),
    getResolvedIssues(),
    getCategories()
  ])

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

      <Suspense fallback={<div>Loading stats...</div>}>
        <DashboardStats issues={issues} categories={categories} />
      </Suspense>

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