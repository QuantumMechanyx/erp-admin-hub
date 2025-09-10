import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IssueForm } from "@/components/issue-form"
import { getIssue, getCategories } from "@/lib/actions"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function EditIssuePage({ params }: { params: { id: string } }) {
  const [issue, categories] = await Promise.all([
    getIssue(params.id),
    getCategories()
  ])

  if (!issue) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/${issue.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Issue
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Issue</h1>
          <p className="text-muted-foreground">
            Update the details and status of this ERP issue
          </p>
        </div>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Issue Details</CardTitle>
          <CardDescription>
            Modify the information about this ERP integration issue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IssueForm categories={categories} issue={issue} isEditing={true} />
        </CardContent>
      </Card>
    </div>
  )
}