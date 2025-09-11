import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" }
      ]
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error fetching email templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, subject, content, variables, isDefault } = body

    // If this template is being set as default, unset all other defaults
    if (isDefault) {
      await prisma.emailTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        description,
        subject,
        content,
        variables: variables ? JSON.stringify(variables) : null,
        isDefault: isDefault || false
      }
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error("Error creating email template:", error)
    return NextResponse.json(
      { error: "Failed to create email template" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}