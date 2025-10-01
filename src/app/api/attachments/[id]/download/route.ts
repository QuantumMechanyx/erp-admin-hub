import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get attachment details
    const attachment = await db.attachment.findUnique({
      where: { id },
      include: {
        note: {
          include: {
            issue: true
          }
        }
      }
    })

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      )
    }

    if (attachment.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: "Attachment not available" },
        { status: 404 }
      )
    }

    // TODO: Add permission checks here
    // For now, we'll allow access if the attachment exists
    // In production, you might want to check:
    // - User has access to the issue
    // - User has permission to view attachments
    // - Issue is not archived/deleted

    // For Vercel Blob with private access, we need to fetch the file
    // and stream it through our API to maintain security
    try {
      const response = await fetch(attachment.storageKey)

      if (!response.ok) {
        throw new Error('Failed to fetch from blob storage')
      }

      const fileBuffer = await response.arrayBuffer()

      // Return the file with appropriate headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': attachment.contentType,
          'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
          'Content-Length': attachment.size.toString(),
        }
      })

    } catch (fetchError) {
      console.error("Error fetching file from blob storage:", fetchError)
      return NextResponse.json(
        { error: "Failed to retrieve file" },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Error downloading attachment:", error)
    return NextResponse.json(
      { error: "Failed to download attachment" },
      { status: 500 }
    )
  }
}