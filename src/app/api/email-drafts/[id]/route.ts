import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const draft = await prisma.emailDraft.findUnique({
      where: { id: params.id },
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

    if (!draft) {
      return NextResponse.json(
        { error: "Draft not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(draft)
  } catch (error) {
    console.error("Error fetching email draft:", error)
    return NextResponse.json(
      { error: "Failed to fetch email draft" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { subject, content, recipients, templateId, issueIds } = await request.json()

    // Update the draft
    const draft = await prisma.emailDraft.update({
      where: { id: params.id },
      data: {
        subject,
        content,
        recipients: recipients ? JSON.stringify(recipients) : null,
        templateId,
        updatedAt: new Date()
      }
    })

    // Update linked issues if provided
    if (issueIds !== undefined) {
      // Remove existing issue links
      await prisma.emailIssue.deleteMany({
        where: { emailDraftId: params.id }
      })

      // Add new issue links
      if (issueIds.length > 0) {
        await prisma.emailIssue.createMany({
          data: issueIds.map((issueId: string) => ({
            emailDraftId: params.id,
            issueId
          }))
        })
      }
    }

    // Return the complete updated draft
    const updatedDraft = await prisma.emailDraft.findUnique({
      where: { id: params.id },
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

    return NextResponse.json(updatedDraft)
  } catch (error) {
    console.error("Error updating email draft:", error)
    return NextResponse.json(
      { error: "Failed to update email draft" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.emailDraft.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting email draft:", error)
    return NextResponse.json(
      { error: "Failed to delete email draft" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}