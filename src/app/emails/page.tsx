"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmailComposer } from "@/components/EmailComposer"
import { TemplateCreator } from "@/components/TemplateCreator"
import { Mail, FileText, Plus, File } from "lucide-react"

interface EmailDraft {
  id: string
  subject: string
  content: string
  recipients?: string
  templateId?: string
  createdAt: string
  updatedAt: string
  template?: {
    name: string
  }
  emailIssues: Array<{
    issue: {
      id: string
      title: string
    }
  }>
}

export default function EmailsPage() {
  const [showComposer, setShowComposer] = useState(false)
  const [showTemplateCreator, setShowTemplateCreator] = useState(false)
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null)
  const [templates, setTemplates] = useState([])
  const [drafts, setDrafts] = useState<EmailDraft[]>([])

  useEffect(() => {
    loadTemplates()
    loadDrafts()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/email-templates')
      if (!response.ok) {
        console.error('Failed to fetch templates:', response.status, response.statusText)
        setTemplates([])
        return
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setTemplates(data)
      } else {
        console.error('Invalid response format:', data)
        setTemplates([])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      setTemplates([])
    }
  }

  const loadDrafts = async () => {
    try {
      const response = await fetch('/api/email-drafts')
      if (!response.ok) {
        console.error('Failed to fetch drafts:', response.status, response.statusText)
        setDrafts([])
        return
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setDrafts(data)
      } else {
        console.error('Invalid drafts response format:', data)
        setDrafts([])
      }
    } catch (error) {
      console.error('Error loading drafts:', error)
      setDrafts([])
    }
  }


  const handleEditDraft = (draftId: string) => {
    setSelectedDraftId(draftId)
    setShowComposer(true)
  }

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/email-drafts/${draftId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setDrafts(drafts.filter(draft => draft.id !== draftId))
      } else {
        console.error('Failed to delete draft')
      }
    } catch (error) {
      console.error('Error deleting draft:', error)
    }
  }

  const handleCloseComposer = () => {
    setShowComposer(false)
    setSelectedDraftId(null)
    // Reload drafts to get updated list
    loadDrafts()
  }

  const handleCloseTemplateCreator = () => {
    setShowTemplateCreator(false)
    // Reload templates to get updated list
    loadTemplates()
  }

  if (showComposer) {
    return (
      <EmailComposer 
        onClose={handleCloseComposer} 
        draftId={selectedDraftId || undefined}
      />
    )
  }

  if (showTemplateCreator) {
    return (
      <TemplateCreator onClose={handleCloseTemplateCreator} />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Drafting Interface</h1>
          <p className="text-muted-foreground">
            Create weekly stakeholder emails with selected issues and updates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTemplateCreator(true)}>
            <File className="w-4 h-4 mr-2" />
            Create Template (Advanced)
          </Button>
          <Button onClick={() => setShowComposer(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Email Draft
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Draft Emails
            </CardTitle>
            <CardDescription>
              Work-in-progress email drafts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {drafts.length > 0 ? (
              <div className="space-y-2">
                {drafts.slice(0, 3).map((draft) => (
                  <div key={draft.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{draft.subject || 'Untitled Draft'}</div>
                      <div className="text-sm text-muted-foreground">
                        {draft.template?.name && `Template: ${draft.template.name} • `}
                        {draft.emailIssues.length > 0 && `${draft.emailIssues.length} issues • `}
                        {new Date(draft.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditDraft(draft.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteDraft(draft.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {drafts.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    and {drafts.length - 3} more drafts...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No draft emails yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Templates
            </CardTitle>
            <CardDescription>
              Reusable email templates ({templates.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templates.length > 0 ? (
              <div className="space-y-2">
                {templates.slice(0, 3).map((template: any) => (
                  <div key={template.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">{template.description}</div>
                    </div>
                    {template.isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                    )}
                  </div>
                ))}
                {templates.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    and {templates.length - 3} more...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No templates yet. Create your first template!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with email drafting and template management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setShowComposer(true)}
              className="h-20 flex-col gap-2"
            >
              <Mail className="w-6 h-6" />
              <span>Compose New Email</span>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setShowTemplateCreator(true)}
              className="h-20 flex-col gap-2"
            >
              <File className="w-6 h-6" />
              <span>Create Template (Advanced)</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}