import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Calendar, 
  Users, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  MessageSquare, 
  AlertTriangle,
  Plus,
  CheckSquare,
  Play,
  Square
} from "lucide-react"
import { getCurrentOrNextMeeting, getAvailableIssues } from "@/lib/meeting-actions"
import { MeetingInterface } from "@/components/meeting-interface"

export default async function MeetingsPage() {
  const [meeting, availableIssues] = await Promise.all([
    getCurrentOrNextMeeting(),
    getAvailableIssues()
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ERP Team Meeting Interface</h1>
          <p className="text-muted-foreground">
            Live meeting discussion and collaboration workspace
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      <MeetingInterface meeting={meeting} availableIssues={availableIssues} />

      {/* Collapsible Sections */}
      <div className="grid md:grid-cols-3 gap-6">
        <Collapsible defaultOpen={false}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Meetings
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </CardTitle>
                <CardDescription>
                  Scheduled meetings and agendas
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <p className="text-center text-muted-foreground py-4">
                  No upcoming meetings scheduled
                </p>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible defaultOpen={false}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Issue Discussions
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </CardTitle>
                <CardDescription>
                  Issues ready for meeting discussion
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <p className="text-center text-muted-foreground py-4">
                  Select issues to discuss in meetings
                </p>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible defaultOpen={false}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Meeting History
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </CardTitle>
                <CardDescription>
                  Previous meetings and minutes
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <p className="text-center text-muted-foreground py-4">
                  No meeting history yet
                </p>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  )
}