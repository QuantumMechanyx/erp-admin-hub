"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { deleteCategory } from "@/lib/actions"
import { Trash2 } from "lucide-react"

interface Category {
  id: string
  name: string
  description?: string | null
  color?: string | null
  _count: {
    issues: number
  }
}

interface CategoriesListProps {
  categories: Category[]
}

export function CategoriesList({ categories: initialCategories }: CategoriesListProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteCategory(categoryToDelete.id)
      if (result?.success) {
        setCategories(categories.filter(c => c.id !== categoryToDelete.id))
        setDeleteDialogOpen(false)
        setCategoryToDelete(null)
      } else if (result?.errors) {
        console.error("Failed to delete category:", result.errors._form?.[0])
      }
    } catch (error) {
      console.error("Failed to delete category:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No categories created yet</p>
        <p className="text-sm text-muted-foreground">
          Create your first category to start organizing issues
        </p>
      </div>
    )
  }

  return (
    <>
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
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteClick(category)}
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
              title={category._count.issues > 0
                ? `Delete category (${category._count.issues} issues will be uncategorized)`
                : "Delete category"}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setCategoryToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        description={
          categoryToDelete?._count.issues && categoryToDelete._count.issues > 0
            ? `This will delete the "${categoryToDelete.name}" category. The ${categoryToDelete._count.issues} issue(s) currently using this category will become uncategorized.`
            : `This will permanently delete the "${categoryToDelete?.name}" category.`
        }
        confirmationText="delete"
        itemName={categoryToDelete?.name || ""}
        isLoading={isDeleting}
      />
    </>
  )
}