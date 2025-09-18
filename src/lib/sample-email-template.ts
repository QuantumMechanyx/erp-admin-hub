// Sample Weekly Summary Email Template
export const sampleWeeklySummaryTemplate = {
  name: "Weekly Summary Email",
  description: "Standard weekly team summary with dashboard data integration",
  subject: "ERP Weekly Status Update - {{currentWeek}}",
  content: `Team,

Here's our weekly ERP status update for {{currentWeek}}.

LAST WEEK'S ISSUES SUMMARY
{{lastWeekSummary}}

CURRENT ISSUES
{{currentIssues}}

RESOLVED ISSUES
{{resolvedIssues}}

If you have any questions or concerns about any of these items, please don't hesitate to reach out.

Best regards,
{{userFirstName}}`,
  variables: JSON.stringify({
    currentDate: "Current date",
    currentWeek: "Week date range",
    lastWeekSummary: "Summary of all issues from last week with their current status",
    resolvedIssues: "List of issues that were resolved",
    currentIssues: "List of current issues (both carried forward and newly discovered)",
    userFirstName: "First name of the logged-in user"
  }),
  isDefault: true
}

// API call to create the sample template
export async function createSampleTemplate() {
  try {
    const response = await fetch('/api/email-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sampleWeeklySummaryTemplate)
    })

    if (!response.ok) {
      throw new Error('Failed to create sample template')
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating sample template:', error)
    throw error
  }
}