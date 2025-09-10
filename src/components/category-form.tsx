"use client"

import { useActionState } from "react"
import { createCategory } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const predefinedColors = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f59e0b", // amber
]

export function CategoryForm() {
  const [state, formAction] = useActionState(createCategory, { errors: {} })

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Category Name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Integration Issues, Data Sync, User Access"
          className="mt-1"
        />
        {state.errors?.name && (
          <p className="text-sm text-red-600 mt-1">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Brief description of what issues this category covers"
          rows={3}
          className="mt-1"
        />
        {state.errors?.description && (
          <p className="text-sm text-red-600 mt-1">{state.errors.description[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="color">Color (optional)</Label>
        <div className="mt-2 space-y-3">
          <div className="flex flex-wrap gap-2">
            {predefinedColors.map((color, index) => (
              <label key={color} className="cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={color}
                  className="sr-only peer"
                />
                <div
                  className="w-8 h-8 rounded-full border-2 border-gray-200 peer-checked:border-gray-900 peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-gray-900 transition-all"
                  style={{ backgroundColor: color }}
                  title={`Color option ${index + 1}`}
                />
              </label>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Or enter a custom hex color:
          </div>
          <Input
            name="color"
            placeholder="#000000"
            pattern="^#[0-9A-Fa-f]{6}$"
            className="w-32"
          />
        </div>
      </div>

      {state.errors?._form && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{state.errors._form[0]}</p>
        </div>
      )}

      {state.success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-600">Category created successfully!</p>
        </div>
      )}

      <Button type="submit" className="w-full">
        Create Category
      </Button>
    </form>
  )
}