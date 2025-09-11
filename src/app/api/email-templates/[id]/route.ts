import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: params.id }
    })

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error fetching email template:", error)
    return NextResponse.json(
      { error: "Failed to fetch email template" },
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
    const body = await request.json()
    const { name, description, subject, content, variables, isDefault } = body

    // If this template is being set as default, unset all other defaults
    if (isDefault) {
      await prisma.emailTemplate.updateMany({
        where: { 
          isDefault: true,
          id: { not: params.id }
        },
        data: { isDefault: false }
      })
    }

    const template = await prisma.emailTemplate.update({
      where: { id: params.id },
      data: {
        name,
        description,
        subject,
        content,
        variables: variables ? JSON.stringify(variables) : null,
        isDefault: isDefault || false
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error updating email template:", error)
    return NextResponse.json(
      { error: "Failed to update email template" },
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
    await prisma.emailTemplate.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting email template:", error)
    return NextResponse.json(
      { error: "Failed to delete email template" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}