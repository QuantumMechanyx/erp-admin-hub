import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { db } from "@/lib/db"
import { z } from "zod"

const UploadSchema = z.object({
  noteId: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  createdBy: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const noteId = formData.get('noteId') as string
    const createdBy = formData.get('createdBy') as string

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate input
    const validatedFields = UploadSchema.safeParse({
      noteId,
      fileName: file.name,
      contentType: file.type,
      createdBy,
    })

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Verify the note exists
    const note = await db.note.findUnique({
      where: { id: noteId }
    })

    if (!note) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      )
    }

    // Create attachment record with UPLOADING status
    const attachment = await db.attachment.create({
      data: {
        noteId,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        storageKey: '', // Will be updated after upload
        status: 'UPLOADING',
        createdBy,
      }
    })

    try {
      // Upload to Vercel Blob
      const blob = await put(`attachments/${attachment.id}/${file.name}`, file, {
        access: 'public', // Public access (we control access via our API)
      })

      // Update attachment with storage key and mark as available
      const updatedAttachment = await db.attachment.update({
        where: { id: attachment.id },
        data: {
          storageKey: blob.url,
          status: 'AVAILABLE',
        }
      })

      return NextResponse.json({
        success: true,
        attachment: updatedAttachment
      })

    } catch (uploadError) {
      // If upload fails, mark attachment as deleted
      await db.attachment.update({
        where: { id: attachment.id },
        data: { status: 'DELETED' }
      })

      throw uploadError
    }

  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}