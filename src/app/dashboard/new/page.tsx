import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IssueForm } from "@/components/issue-form"
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
            Document a new ERP integration issue with detailed information
          </p>
        </div>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Issue Details</CardTitle>
          <CardDescription>
            Provide comprehensive information about the ERP issue including the problem, 
            resolution plan, work performed, and any roadblocks encountered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IssueForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  )
}