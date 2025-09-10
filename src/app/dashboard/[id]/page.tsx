import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getIssue } from "@/lib/actions"
import { IssueNotes } from "@/components/issue-notes"
import { IssueActions } from "@/components/issue-actions"
import { CmicTicketManager } from "@/components/cmic-ticket-manager"
import Link from "next/link"
import { ArrowLeft, Edit, Calendar, User } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

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

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const issue = await getIssue(id)

  if (!issue) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{issue.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Created {format(new Date(issue.createdAt), "MMM d, yyyy")}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Updated {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
            </div>
            {issue.assignedTo && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {issue.assignedTo}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={priorityColors[issue.priority]}>
            {issue.priority}
          </Badge>
          <Badge className={statusColors[issue.status]}>
            {issue.status.replace("_", " ")}
          </Badge>
          {issue.category && (
            <Badge variant="outline">
              {issue.category.name}
            </Badge>
          )}
          <Button asChild>
            <Link href={`/dashboard/${issue.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Issue
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {issue.description && (
            <Card>
              <CardHeader>
                <CardTitle>Problem Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{issue.description}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {issue.resolutionPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Resolution Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{issue.resolutionPlan}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {issue.workPerformed && (
            <Card>
              <CardHeader>
                <CardTitle>Work Performed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{issue.workPerformed}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {issue.roadblocks && (
            <Card>
              <CardHeader>
                <CardTitle>Roadblocks & Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{issue.roadblocks}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {issue.usersInvolved && (
            <Card>
              <CardHeader>
                <CardTitle>Users Involved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{issue.usersInvolved}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <CmicTicketManager issue={issue} cmicNotes={issue.cmicNotes} />
          <IssueNotes issueId={issue.id} notes={issue.notes} />
          <IssueActions issue={issue} />
        </div>
      </div>
    </div>
  )
}