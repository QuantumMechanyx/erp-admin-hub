import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCategories } from "@/lib/actions"
import { CategoryForm } from "@/components/category-form"
import { CategoriesList } from "@/components/categories-list"
import Link from "next/link"
import { ArrowLeft, Plus, Settings } from "lucide-react"

export default async function CategoriesPage() {
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
          <h1 className="text-3xl font-bold">Manage Categories</h1>
          <p className="text-muted-foreground">
            Create and organize categories for better issue management
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Category
            </CardTitle>
            <CardDescription>
              Add a new category to organize your ERP issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Existing Categories
            </CardTitle>
            <CardDescription>
              Manage your current category system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoriesList categories={categories} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}