// Sample Weekly Summary Email Template
export const sampleWeeklySummaryTemplate = {
  name: "Weekly Summary Email",
  description: "Standard weekly stakeholder summary with dashboard data integration",
  subject: "ERP Weekly Status Update - {{currentWeek}}",
  content: `Dear Stakeholders,

I hope this email finds you well. Here's our weekly ERP status update for {{currentWeek}}.

## Executive Summary

This week we have {{stats.total}} total issues in our system, with {{stats.open}} currently open and {{stats.inProgress}} actively being worked on. We're pleased to report that {{stats.resolvedThisWeek}} issues were resolved this week.

## Current Status Overview

- **Total Issues:** {{stats.total}}
- **Open Issues:** {{stats.open}}
- **In Progress:** {{stats.inProgress}}
- **Resolved This Week:** {{stats.resolvedThisWeek}}
- **High Priority Items:** {{stats.highPriority}}

## Issues Resolved This Week

{{resolvedThisWeek}}

## Issues Currently In Progress

{{inProgressIssues}}

## Open Issues Requiring Attention

{{openIssues}}

## High Priority Items

{{highPriorityIssues}}

## Looking Ahead

We continue to focus on addressing high-priority issues and maintaining system stability. Our team remains committed to resolving outstanding issues in a timely manner.

If you have any questions or concerns about any of these items, please don't hesitate to reach out.

Best regards,
ERP Administration Team

---
This report was generated on {{currentDate}} from our ERP Admin Hub dashboard.`,
  variables: JSON.stringify({
    currentDate: "Current date",
    currentWeek: "Week date range",
    "stats.total": "Total number of issues",
    "stats.open": "Number of open issues",
    "stats.inProgress": "Number of issues in progress",
    "stats.resolved": "Number of resolved issues",
    "stats.resolvedThisWeek": "Number resolved this week",
    "stats.highPriority": "Number of high priority issues",
    openIssues: "List of open issues",
    inProgressIssues: "List of in-progress issues",
    resolvedThisWeek: "List of issues resolved this week",
    highPriorityIssues: "List of high priority issues"
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