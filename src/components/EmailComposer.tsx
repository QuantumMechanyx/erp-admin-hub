"use client"

import { useState, useEffect, useCallback } from "react"
import { AIEmailAssistant } from "@/components/AIEmailAssistant"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Mail, 
  Send, 
  Save, 
  Eye, 
  File, 
  FileText, 
  Plus,
  X,
  RefreshCw,
  Copy,
  Bot
} from "lucide-react"

interface EmailTemplate {
  id: string
  name: string
  description?: string
  subject: string
  content: string
  variables?: string
  isDefault: boolean
}

interface TemplateData {
  currentDate: string
  currentWeek: string
  stats: {
    total: number
    open: number
    inProgress: number
    resolved: number
    closed: number
    resolvedThisWeek: number
    newThisWeek: number
    highPriority: number
  }
  openIssues: Array<{
    id: string
    title: string
    description?: string
    priority: string
    category: string
    assignedTo?: string
    createdAt: string
  }>
  inProgressIssues: Array<{
    id: string
    title: string
    description?: string
    priority: string
    category: string
    assignedTo?: string
    workPerformed?: string
  }>
  resolvedThisWeek: Array<{
    id: string
    title: string
    description?: string
    category: string
    resolvedAt: string
  }>
  highPriorityIssues: Array<{
    id: string
    title: string
    priority: string
    category: string
    status: string
  }>
  categoryBreakdown: Array<{
    name: string
    count: number
    color?: string
  }>
}

interface EmailComposerProps {
  onClose?: () => void
  draftId?: string
}

export function EmailComposer({ onClose, draftId }: EmailComposerProps) {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [templateData, setTemplateData] = useState<TemplateData | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [recipients, setRecipients] = useState<string[]>([
    'rebecca.freeman@deacon.com',
    'lisa.terlson@deacon.com', 
    'sarah.pham@deacon.com',
    'lorrie.langlois@deacon.com',
    'matt.jaworski@deacon.com',
    'rachel.diel@deacon.com'
  ])
  const [newRecipient, setNewRecipient] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId || null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [draftSaveStatus, setDraftSaveStatus] = useState<string | null>(null)
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([])

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    // Only auto-save if we have some content and it's not the first load
    if (!subject && !content) return
    if (isSavingDraft) return
    
    try {
      const draftData = {
        subject,
        content,
        recipients,
        templateId: selectedTemplate || null,
        issueIds: selectedIssueIds
      }
      
      let response
      if (currentDraftId) {
        response = await fetch(`/api/email-drafts/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draftData)
        })
      } else {
        response = await fetch('/api/email-drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draftData)
        })
      }
      
      if (response.ok) {
        const savedDraft = await response.json()
        if (!currentDraftId) {
          setCurrentDraftId(savedDraft.id)
        }
        setDraftSaveStatus('auto-saved')
        setTimeout(() => setDraftSaveStatus(null), 2000)
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }, [subject, content, recipients, selectedTemplate, selectedIssueIds, currentDraftId, isSavingDraft])

  // Debounced auto-save effect
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      autoSave()
    }, 3000) // Auto-save 3 seconds after user stops typing

    return () => clearTimeout(autoSaveTimer)
  }, [autoSave])

  // Load templates and template data on mount
  useEffect(() => {
    loadTemplates()
    loadTemplateData()
    if (draftId) {
      loadDraft(draftId)
    }
  }, [draftId])

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/email-templates")
      const data = await response.json()
      setTemplates(data)
      
      // Auto-select default template if none selected
      const defaultTemplate = data.find((t: EmailTemplate) => t.isDefault)
      if (defaultTemplate && !selectedTemplate) {
        setSelectedTemplate(defaultTemplate.id)
        applyTemplate(defaultTemplate)
      }
    } catch (error) {
      console.error("Error loading templates:", error)
    }
  }

  const loadTemplateData = async () => {
    setIsLoadingData(true)
    try {
      const response = await fetch("/api/email-templates/template-data")
      const data = await response.json()
      setTemplateData(data)
    } catch (error) {
      console.error("Error loading template data:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const applyTemplate = (template: EmailTemplate) => {
    setSubject(template.subject)
    setContent(template.content)
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find(t => t.id === templateId)
    if (template) {
      applyTemplate(template)
    }
  }

  const processTemplate = (text: string): string => {
    if (!templateData) return text

    let processed = text
    
    // Replace date variables
    processed = processed.replace(/{{currentDate}}/g, templateData.currentDate)
    processed = processed.replace(/{{currentWeek}}/g, templateData.currentWeek)
    
    // Replace user variables
    const userFirstName = user?.name?.split(' ')[0] || user?.name || 'Admin'
    processed = processed.replace(/{{userFirstName}}/g, userFirstName)
    
    // Replace statistics
    Object.entries(templateData.stats).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{{stats\\.${key}}}`, 'g'), value.toString())
    })
    
    // Replace issue lists
    if (processed.includes('{{openIssues}}') && templateData.openIssues.length > 0) {
      const issuesList = templateData.openIssues.map(issue => 
        `• ${issue.title} (${issue.priority}) - ${issue.category}`
      ).join('\\n')
      processed = processed.replace(/{{openIssues}}/g, issuesList)
    }
    
    if (processed.includes('{{inProgressIssues}}') && templateData.inProgressIssues.length > 0) {
      const issuesList = templateData.inProgressIssues.map(issue => 
        `• ${issue.title} (${issue.priority}) - ${issue.category}${issue.workPerformed ? ` - Work: ${issue.workPerformed}` : ''}`
      ).join('\\n')
      processed = processed.replace(/{{inProgressIssues}}/g, issuesList)
    }
    
    if (processed.includes('{{resolvedThisWeek}}') && templateData.resolvedThisWeek.length > 0) {
      const issuesList = templateData.resolvedThisWeek.map(issue => 
        `• ${issue.title} - ${issue.category} (Resolved: ${issue.resolvedAt})`
      ).join('\\n')
      processed = processed.replace(/{{resolvedThisWeek}}/g, issuesList)
    }
    
    return processed
  }

  const addRecipient = () => {
    if (newRecipient && !recipients.includes(newRecipient)) {
      setRecipients([...recipients, newRecipient])
      setNewRecipient("")
    }
  }

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email))
  }

  const loadDraft = async (id: string) => {
    try {
      const response = await fetch(`/api/email-drafts/${id}`)
      if (!response.ok) {
        console.error('Failed to load draft:', response.status)
        return
      }
      
      const draft = await response.json()
      setSubject(draft.subject)
      setContent(draft.content)
      setSelectedTemplate(draft.templateId || "")
      
      if (draft.recipients) {
        const recipientsList = JSON.parse(draft.recipients)
        setRecipients(recipientsList)
      }
      
      if (draft.emailIssues && draft.emailIssues.length > 0) {
        const issueIds = draft.emailIssues.map((ei: any) => ei.issueId)
        setSelectedIssueIds(issueIds)
      }
      
      setCurrentDraftId(id)
    } catch (error) {
      console.error('Error loading draft:', error)
    }
  }

  const handleSave = async () => {
    setIsSavingDraft(true)
    setDraftSaveStatus(null)
    
    try {
      const draftData = {
        subject,
        content,
        recipients,
        templateId: selectedTemplate || null,
        issueIds: selectedIssueIds
      }
      
      let response
      if (currentDraftId) {
        // Update existing draft
        response = await fetch(`/api/email-drafts/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draftData)
        })
      } else {
        // Create new draft
        response = await fetch('/api/email-drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draftData)
        })
      }
      
      if (!response.ok) {
        throw new Error('Failed to save draft')
      }
      
      const savedDraft = await response.json()
      setCurrentDraftId(savedDraft.id)
      setDraftSaveStatus('saved')
      
      setTimeout(() => setDraftSaveStatus(null), 3000)
    } catch (error) {
      console.error('Error saving draft:', error)
      setDraftSaveStatus('error')
      setTimeout(() => setDraftSaveStatus(null), 3000)
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleSend = async () => {
    setIsLoading(true)
    try {
      // Send email logic here
      console.log("Sending email:", { from: user?.email, subject, content, recipients })
    } catch (error) {
      console.error("Error sending email:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Composer</h2>
          <p className="text-muted-foreground">
            Create and send stakeholder emails with dashboard data integration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTemplateData} disabled={isLoadingData}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingData ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="data">Template Data</TabsTrigger>
          <TabsTrigger value="ai-assistant">
            <Bot className="w-4 h-4 mr-2" />
            AI Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <File className="w-5 h-5" />
                    Email Template
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template">Select Template</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              {template.name}
                              {template.isDefault && (
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* From field hidden for copy/paste workflow */}
                  {false && (
                    <div className="space-y-2">
                      <Label htmlFor="from">From</Label>
                      <Input
                        id="from"
                        value={user ? `${user.name} <${user.email}>` : ""}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Email subject..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Email content..."
                      className="min-h-[400px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use template variables like {`{{currentDate}}, {{userFirstName}}, {{stats.total}}, {{openIssues}}`}, etc.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Recipients and Actions sections temporarily hidden - will be re-enabled when ready for email sending */}
              {false && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Recipients</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={newRecipient}
                          onChange={(e) => setNewRecipient(e.target.value)}
                          placeholder="email@example.com"
                          onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                        />
                        <Button size="sm" onClick={addRecipient}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {recipients.map((recipient) => (
                          <div key={recipient} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm">{recipient}</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => removeRecipient(recipient)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      {recipients.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-4">
                          No recipients added yet
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button onClick={handleSave} disabled={isSavingDraft} className="w-full">
                        <Save className="w-4 h-4 mr-2" />
                        {isSavingDraft ? 'Saving...' : currentDraftId ? 'Update Draft' : 'Save Draft'}
                      </Button>
                      {draftSaveStatus === 'saved' && (
                        <p className="text-sm text-green-600 text-center">Draft saved successfully!</p>
                      )}
                      {draftSaveStatus === 'auto-saved' && (
                        <p className="text-sm text-gray-500 text-center">Auto-saved</p>
                      )}
                      {draftSaveStatus === 'error' && (
                        <p className="text-sm text-red-600 text-center">Failed to save draft</p>
                      )}
                      <Button 
                        onClick={handleSend} 
                        disabled={isLoading || recipients.length === 0}
                        variant="default"
                        className="w-full"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Email
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
              
              {/* Placeholder card to indicate future functionality */}
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <Mail className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">Email Sending Coming Soon</p>
                    <p className="text-xs text-muted-foreground">
                      Recipients and sending functionality will be enabled in a future update
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Email Preview
              </CardTitle>
              <CardDescription>
                Preview how your email will look with template variables processed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-background">
                <div className="space-y-4">
                  <div>
                    <strong>Subject:</strong> {processTemplate(subject)}
                  </div>
                  <Separator />
                  <div className="whitespace-pre-wrap">
                    {processTemplate(content)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Available Template Variables
              </CardTitle>
              <CardDescription>
                Current dashboard data available for your email templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading template data...
                </div>
              ) : templateData ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Date Variables</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <code>{`{{currentDate}}`}</code>
                      <span>{templateData.currentDate}</span>
                      <code>{`{{currentWeek}}`}</code>
                      <span>{templateData.currentWeek}</span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">User Variables</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <code>{`{{userFirstName}}`}</code>
                      <span>{user?.name?.split(' ')[0] || user?.name || 'Admin'}</span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Statistics</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(templateData.stats).map(([key, value]) => (
                        <div key={key} className="contents">
                          <code>{`{{stats.${key}}}`}</code>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Issue Lists</h4>
                    <div className="space-y-2 text-sm">
                      <div><code>{`{{openIssues}}`}</code> - {templateData.openIssues.length} issues</div>
                      <div><code>{`{{inProgressIssues}}`}</code> - {templateData.inProgressIssues.length} issues</div>
                      <div><code>{`{{resolvedThisWeek}}`}</code> - {templateData.resolvedThisWeek.length} issues</div>
                      <div><code>{`{{highPriorityIssues}}`}</code> - {templateData.highPriorityIssues.length} issues</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Failed to load template data
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-assistant" className="space-y-6">
          <AIEmailAssistant 
            onEmailGenerated={(generatedSubject, generatedContent) => {
              if (generatedSubject) setSubject(generatedSubject)
              if (generatedContent) setContent(generatedContent)
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}