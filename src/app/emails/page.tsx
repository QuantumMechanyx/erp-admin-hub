import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, FileText, Send } from "lucide-react"

export default function EmailsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Drafting Interface</h1>
          <p className="text-muted-foreground">
            Create weekly stakeholder emails with selected issues and updates
          </p>
        </div>
        <Button>
          New Email Draft
        </Button>
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
              Reusable email templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Create templates for consistency
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Drafting Interface - Coming Soon</CardTitle>
          <CardDescription>
            This interface will allow you to create professional weekly emails to stakeholders 
            with selected issues and their current status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              The email drafting interface is currently under development and will include:
            </p>
            <ul className="text-left max-w-md mx-auto space-y-2 text-sm text-muted-foreground">
              <li>• Issue selection for weekly updates</li>
              <li>• Rich text email composer</li>
              <li>• Email templates and formatting</li>
              <li>• Preview and send functionality</li>
              <li>• Stakeholder mailing lists</li>
              <li>• Email history and archives</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}