import { notFound } from "next/navigation"
import { IssueFormSimple } from "@/components/issue-form-simple"
import { getIssue, getCategories } from "@/lib/actions"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function EditIssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [issue, categories] = await Promise.all([
    getIssue(id),
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
            Update the issue details and action items
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        <IssueFormSimple categories={categories} issue={issue} isEditing={true} />
      </div>
    </div>
  )
}