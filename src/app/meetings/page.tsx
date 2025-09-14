import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Calendar, 
  Users, 
  FileText, 
  ChevronRight
} from "lucide-react"
import { getCurrentOrNextMeeting, getAvailableIssues, addIssueToMeeting } from "@/lib/meeting-actions"
import { MeetingInterface } from "@/components/meeting-interface"
import { redirect } from "next/navigation"

export const revalidate = 0

interface MeetingsPageProps {
  searchParams: Promise<{ issue?: string }>
}

export default async function MeetingsPage({ searchParams }: MeetingsPageProps) {
  const resolvedSearchParams = await searchParams
  const [meeting, availableIssues] = await Promise.all([
    getCurrentOrNextMeeting(),
    getAvailableIssues()
  ])

  // If an issue ID is provided in the URL, add it to the meeting
  if (resolvedSearchParams.issue) {
    try {
      // Check if the issue is already in the meeting
      const issueAlreadyInMeeting = meeting.meetingItems.some(
        item => item.issueId === resolvedSearchParams.issue
      )

      if (!issueAlreadyInMeeting) {
        await addIssueToMeeting(meeting.id, resolvedSearchParams.issue)
        // Redirect to remove the query parameter after adding
        redirect('/meetings')
      }
    } catch (error) {
      console.error("Failed to add issue to meeting:", error)
    }
  }

  return (
    <div className="space-y-6">

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