"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, X } from "lucide-react"

interface ActionItemFormData {
  title: string
  description: string
  priority: number
  dueDate: string
}

interface ActionItemFormProps {
  issueId: string
  onSubmit: (issueId: string, actionItem: ActionItemFormData) => Promise<void>
  onCancel: () => void
}

export function ActionItemForm({ issueId, onSubmit, onCancel }: ActionItemFormProps) {
  const [formData, setFormData] = useState<ActionItemFormData>({
    title: '',
    description: '',
    priority: 1,
    dueDate: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field: keyof ActionItemFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(issueId, formData)
      setFormData({
        title: '',
        description: '',
        priority: 1,
        dueDate: ''
      })
    } catch (error) {
      console.error('Error creating action item:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Add Action Item</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <div>
          <Input
            type="text"
            placeholder="Action item title (required)"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="text-sm"
            required
          />
        </div>
        
        <div>
          <Textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="text-sm min-h-[60px]"
            rows={2}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Select
              value={formData.priority.toString()}
              onValueChange={(value) => updateField('priority', parseInt(value))}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Low</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">High</SelectItem>
                <SelectItem value="4">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative">
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => updateField('dueDate', e.target.value)}
              className="text-sm pr-10"
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={!formData.title.trim() || isSubmitting}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Creating...' : 'Create Action Item'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}