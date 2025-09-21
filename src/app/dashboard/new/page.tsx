import { IssueFormSimple } from "@/components/issue-form-simple"
import { getCategories } from "@/lib/actions"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function NewIssuePage() {
  const categories = await getCategories()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Issue</h1>
          <p className="text-muted-foreground">
            Document a new issue with description and action items
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        <IssueFormSimple categories={categories} />
      </div>
    </div>
  )
}