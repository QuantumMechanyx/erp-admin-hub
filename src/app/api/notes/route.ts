import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const CreateNoteSchema = z.object({
  issueId: z.string(),
  content: z.string().min(1, "Note content is required"),
  author: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("POST /api/notes - received data:", body)

    const validatedFields = CreateNoteSchema.safeParse(body)

    if (!validatedFields.success) {
      console.log("Validation failed:", validatedFields.error.flatten().fieldErrors)
      return NextResponse.json(
        { errors: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    console.log("Creating note with data:", validatedFields.data)
    const note = await db.note.create({
      data: validatedFields.data,
    })
    console.log("Note created successfully:", note)

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error("Error creating note:", error)
    return NextResponse.json(
      { errors: { _form: ["Failed to create note"] } },
      { status: 500 }
    )
  }
}