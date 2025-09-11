import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { sampleWeeklySummaryTemplate } from "@/lib/sample-email-template"

const prisma = new PrismaClient()

export async function POST() {
  try {
    // Check if any templates exist
    const existingTemplates = await prisma.emailTemplate.count()
    
    if (existingTemplates === 0) {
      // Create the sample template
      const template = await prisma.emailTemplate.create({
        data: sampleWeeklySummaryTemplate
      })

      return NextResponse.json({ 
        message: "Sample template created successfully",
        template 
      })
    } else {
      return NextResponse.json({ 
        message: "Templates already exist",
        count: existingTemplates 
      })
    }
  } catch (error) {
    console.error("Error initializing email templates:", error)
    return NextResponse.json(
      { error: "Failed to initialize email templates" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}