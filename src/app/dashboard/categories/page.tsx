import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCategories } from "@/lib/actions"
import { CategoryForm } from "@/components/category-form"
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
            {categories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No categories created yet</p>
                <p className="text-sm text-muted-foreground">
                  Create your first category to start organizing issues
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{category.name}</h4>
                        {category.color && (
                          <div 
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {category._count.issues} issues
                        </Badge>
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}