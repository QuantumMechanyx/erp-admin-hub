import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const drafts = await prisma.emailDraft.findMany({
      include: {
        template: true,
        emailIssues: {
          include: {
            issue: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(drafts)
  } catch (error) {
    console.error("Error fetching email drafts:", error)
    return NextResponse.json(
      { error: "Failed to fetch email drafts" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const { subject, content, recipients, templateId, issueIds } = await request.json()

    // Create the draft
    const draft = await prisma.emailDraft.create({
      data: {
        subject,
        content,
        recipients: recipients ? JSON.stringify(recipients) : null,
        templateId
      }
    })

    // Link issues to the draft if provided
    if (issueIds && issueIds.length > 0) {
      await prisma.emailIssue.createMany({
        data: issueIds.map((issueId: string) => ({
          emailDraftId: draft.id,
          issueId
        }))
      })
    }

    // Return the complete draft with relations
    const completeDraft = await prisma.emailDraft.findUnique({
      where: { id: draft.id },
      include: {
        template: true,
        emailIssues: {
          include: {
            issue: {
              include: {
                category: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(completeDraft)
  } catch (error) {
    console.error("Error creating email draft:", error)
    return NextResponse.json(
      { error: "Failed to create email draft" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}