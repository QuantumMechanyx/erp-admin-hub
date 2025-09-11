"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmailComposer } from "@/components/EmailComposer"
import { Mail, FileText, Send, Plus, File } from "lucide-react"

export default function EmailsPage() {
  const [showComposer, setShowComposer] = useState(false)
  const [templates, setTemplates] = useState([])
  const [drafts, setDrafts] = useState([])
  const [sentEmails, setSentEmails] = useState([])

  useEffect(() => {
    loadTemplates()
    loadDrafts()
    loadSentEmails()
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
    // TODO: Implement drafts loading
  }

  const loadSentEmails = async () => {
    // TODO: Implement sent emails loading
  }

  if (showComposer) {
    return (
      <EmailComposer onClose={() => setShowComposer(false)} />
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
          <Button variant="outline" onClick={() => {/* TODO: Show template manager */}}>
            <File className="w-4 h-4 mr-2" />
            Manage Templates
          </Button>
          <Button onClick={() => setShowComposer(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Email Draft
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
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
            <p className="text-center text-muted-foreground py-8">
              No draft emails yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Sent Emails
            </CardTitle>
            <CardDescription>
              Previously sent stakeholder updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              No sent emails yet
            </p>
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
              onClick={() => {/* TODO: Create template */}}
              className="h-20 flex-col gap-2"
            >
              <File className="w-6 h-6" />
              <span>Create Template</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}