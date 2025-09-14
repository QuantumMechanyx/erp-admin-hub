"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  Bot, 
  User, 
  Send, 
  MessageSquare, 
  Copy,
  RefreshCw,
  Sparkles 
} from "lucide-react"

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIEmailAssistantProps {
  onEmailGenerated?: (subject: string, content: string) => void
}

export function AIEmailAssistant({ onEmailGenerated }: AIEmailAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversation, setConversation] = useState<any[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Add welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm your AI Email Assistant. I have access to all your current ERP issues, meetings, and dashboard data. I can help you:\n\n• Write weekly summary emails\n• Draft issue update communications\n• Suggest relevant content based on recent activity\n• Generate subject lines and improve drafts\n\nWhat kind of email would you like to create?",
        timestamp: new Date()
      }])
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage("")
    
    // Add user message immediately
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newUserMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversation: conversation
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Add AI response
        const aiMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
        setConversation(data.conversation || [])

        // Check if the response contains an email draft
        if (data.message.includes('Subject:') || data.message.includes('Dear ') || data.message.includes('Hi ')) {
          // Try to extract subject and content if it looks like an email
          extractEmailDraft(data.message)
        }
      } else {
        throw new Error(data.error || 'Failed to get AI response')
      }
    } catch (error) {
      console.error('AI chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const extractEmailDraft = (content: string) => {
    // Look for email draft markers and extract only the email content
    const emailStartMarkers = ['---', '**Subject:**', 'Subject:']
    const emailEndMarkers = ['---', 'Feel free to customize', 'Let me know if you need', 'Best regards']
    
    let startIndex = -1
    let endIndex = content.length
    
    // Find the start of the actual email
    for (const marker of emailStartMarkers) {
      const index = content.indexOf(marker)
      if (index !== -1) {
        startIndex = index
        break
      }
    }
    
    // Find the end of the actual email
    for (const marker of emailEndMarkers) {
      const index = content.lastIndexOf(marker)
      if (index !== -1 && index > startIndex) {
        // If it's the closing "---", include it. Otherwise, stop before the marker
        endIndex = marker === '---' ? index + 3 : index
        break
      }
    }
    
    if (startIndex === -1) return // No email found
    
    // Extract the email portion
    let emailText = content.substring(startIndex, endIndex).trim()
    
    // Remove leading/trailing --- markers
    emailText = emailText.replace(/^---\s*/, '').replace(/\s*---$/, '').trim()
    
    const lines = emailText.split('\n')
    let subject = ''
    let emailContent = ''
    
    // Look for subject line
    const subjectLine = lines.find(line => 
      line.toLowerCase().includes('subject:') || 
      line.startsWith('**Subject:**')
    )
    
    if (subjectLine) {
      subject = subjectLine.replace(/^\*\*Subject:\*\*\s*/i, '')
                          .replace(/^subject:\s*/i, '')
                          .trim()
      
      // Extract content after subject
      const subjectIndex = lines.indexOf(subjectLine)
      emailContent = lines.slice(subjectIndex + 1).join('\n').trim()
    } else {
      emailContent = emailText
    }
    
    if (subject || emailContent) {
      onEmailGenerated?.(subject, emailContent)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const quickPrompts = [
    "Help me write this week's summary email",
    "Draft an update about the PCO sync issue",
    "What issues should I include in my stakeholder update?",
    "Generate a subject line for my weekly report"
  ]

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt)
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            AI Email Assistant
            <Badge variant="secondary" className="ml-auto">
              <Sparkles className="w-3 h-3 mr-1" />
              Context-Aware
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col space-y-4 p-4 min-h-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-50 text-gray-900 border'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      <div className={`flex items-center justify-between mt-2 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-6 w-6 p-0 ${
                            message.role === 'user' 
                              ? 'hover:bg-blue-600 text-blue-100' 
                              : 'hover:bg-gray-200 text-gray-400'
                          }`}
                          onClick={() => copyMessage(message.content)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-gray-50 border rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        AI is thinking...
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Prompts */}
          {messages.length <= 1 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-medium">Quick start prompts:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => handleQuickPrompt(prompt)}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex-shrink-0 flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me to help write your email..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
              className="flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}