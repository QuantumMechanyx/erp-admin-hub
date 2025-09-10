"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const CreateMeetingSchema = z.object({
  title: z.string().min(1, "Meeting title is required"),
  meetingDate: z.date(),
  agenda: z.string().optional(),
})

export async function getCurrentOrNextMeeting() {
  try {
    // First, try to find an active meeting
    let meeting = await db.meeting.findFirst({
      where: {
        status: "ACTIVE"
      },
      include: {
        meetingItems: {
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

    // If no active meeting, find a planned meeting for today or future
    if (!meeting) {
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Start of today
      
      meeting = await db.meeting.findFirst({
        where: {
          status: "PLANNED",
          meetingDate: {
            gte: today
          }
        },
        orderBy: {
          meetingDate: "asc"
        },
        include: {
          meetingItems: {
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
    }

    // If no planned meeting for today or future, find today's meeting (even if status is not PLANNED)
    if (!meeting) {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      today.setHours(0, 0, 0, 0)
      tomorrow.setHours(0, 0, 0, 0)
      
      meeting = await db.meeting.findFirst({
        where: {
          meetingDate: {
            gte: today,
            lt: tomorrow
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        include: {
          meetingItems: {
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
    }

    // Only create a new meeting if none exists for today
    if (!meeting) {
      meeting = await createDefaultMeeting()
    }

    return meeting
  } catch (error) {
    console.error("Error getting current/next meeting:", error)
    throw new Error("Failed to get meeting data")
  }
}

export async function createDefaultMeeting() {
  try {
    const meeting = await db.meeting.create({
      data: {
        title: `ERP Team Meeting - ${new Date().toLocaleDateString()}`,
        meetingDate: new Date(),
        status: "PLANNED"
      },
      include: {
        meetingItems: {
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

    // Auto-add carried over items from the last completed meeting
    await addCarriedOverItems(meeting.id)

    return meeting
  } catch (error) {
    console.error("Error creating default meeting:", error)
    throw new Error("Failed to create meeting")
  }
}

export async function addCarriedOverItems(meetingId: string) {
  try {
    // Find the last completed meeting
    const lastMeeting = await db.meeting.findFirst({
      where: {
        status: "COMPLETED"
      },
      orderBy: {
        meetingDate: "desc"
      },
      include: {
        meetingItems: {
          include: {
            issue: true
          }
        }
      }
    })

    if (!lastMeeting) return

    // Find issues that were discussed but are still open or in progress
    const itemsToCarryOver = lastMeeting.meetingItems.filter(item => 
      item.issue.status === "OPEN" || item.issue.status === "IN_PROGRESS"
    )

    // Add these items to the new meeting
    for (const item of itemsToCarryOver) {
      await db.meetingItem.create({
        data: {
          meetingId,
          issueId: item.issueId,
          carriedOver: true,
          discussionNotes: `Carried over from ${lastMeeting.title}`
        }
      })
    }

  } catch (error) {
    console.error("Error adding carried over items:", error)
    throw new Error("Failed to add carried over items")
  }
}

export async function startMeeting(meetingId: string) {
  try {
    await db.meeting.update({
      where: { id: meetingId },
      data: {
        status: "ACTIVE",
        startedAt: new Date()
      }
    })

    revalidatePath("/meetings")
  } catch (error) {
    console.error("Error starting meeting:", error)
    throw new Error("Failed to start meeting")
  }
}

export async function endMeeting(meetingId: string, generalNotes?: string, externalHelp?: string) {
  try {
    await db.meeting.update({
      where: { id: meetingId },
      data: {
        status: "COMPLETED",
        endedAt: new Date(),
        generalNotes,
        externalHelp
      }
    })

    revalidatePath("/meetings")
  } catch (error) {
    console.error("Error ending meeting:", error)
    throw new Error("Failed to end meeting")
  }
}

export async function addIssueToMeeting(meetingId: string, issueId: string) {
  try {
    await db.meetingItem.create({
      data: {
        meetingId,
        issueId,
        carriedOver: false
      }
    })

    revalidatePath("/meetings")
  } catch (error) {
    console.error("Error adding issue to meeting:", error)
    throw new Error("Failed to add issue to meeting")
  }
}

export async function addMultipleIssuesToMeeting(prevState: any, formData: FormData) {
  try {
    const meetingId = formData.get("meetingId") as string
    const issueIds = formData.getAll("issueIds") as string[]

    console.log("Adding issues to meeting:", { meetingId, issueIds })

    for (const issueId of issueIds) {
      await db.meetingItem.create({
        data: {
          meetingId,
          issueId,
          carriedOver: false
        }
      })
    }

    revalidatePath("/meetings")
    return { success: true }
  } catch (error) {
    console.error("Error adding issues to meeting:", error)
    return { error: "Failed to add issues to meeting" }
  }
}

export async function removeIssueFromMeeting(meetingId: string, issueId: string) {
  try {
    await db.meetingItem.deleteMany({
      where: {
        meetingId,
        issueId
      }
    })

    revalidatePath("/meetings")
  } catch (error) {
    console.error("Error removing issue from meeting:", error)
    throw new Error("Failed to remove issue from meeting")
  }
}

export async function updateMeetingItemNotes(meetingId: string, issueId: string, discussionNotes: string) {
  try {
    await db.meetingItem.updateMany({
      where: {
        meetingId,
        issueId
      },
      data: {
        discussionNotes
      }
    })

    revalidatePath("/meetings")
  } catch (error) {
    console.error("Error updating meeting item notes:", error)
    throw new Error("Failed to update notes")
  }
}

export async function getAvailableIssues() {
  try {
    return await db.issue.findMany({
      where: {
        status: {
          in: ["OPEN", "IN_PROGRESS"]
        }
      },
      include: {
        category: true
      },
      orderBy: [
        { priority: "desc" },
        { updatedAt: "desc" }
      ]
    })
  } catch (error) {
    console.error("Error getting available issues:", error)
    throw new Error("Failed to get available issues")
  }
}