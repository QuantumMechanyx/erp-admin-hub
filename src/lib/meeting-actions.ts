"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { formatDateForMeetingTitle } from "@/lib/timezone"


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
                category: true,
                additionalHelpNotes: {
                  orderBy: { createdAt: "desc" }
                },
                actionItems: {
                  orderBy: { priority: "desc" }
                },
                notes: {
                  orderBy: { createdAt: "desc" }
                },
                cmicNotes: {
                  orderBy: { createdAt: "desc" }
                }
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
                  category: true,
                  additionalHelpNotes: {
                    orderBy: { createdAt: "desc" }
                  },
                  actionItems: {
                    orderBy: { priority: "desc" }
                  },
                  notes: {
                    orderBy: { createdAt: "desc" }
                  }
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
                  category: true,
                  additionalHelpNotes: {
                    orderBy: { createdAt: "desc" }
                  },
                  actionItems: {
                    orderBy: { priority: "desc" }
                  },
                  notes: {
                    orderBy: { createdAt: "desc" }
                  }
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
        title: `ERP Team Meeting - ${formatDateForMeetingTitle()}`,
        meetingDate: new Date(),
        status: "PLANNED"
      },
      include: {
        meetingItems: {
          include: {
            issue: {
              include: {
                category: true,
                additionalHelpNotes: {
                  orderBy: { createdAt: "desc" }
                },
                actionItems: {
                  orderBy: { priority: "desc" }
                },
                notes: {
                  orderBy: { createdAt: "desc" }
                },
                cmicNotes: {
                  orderBy: { createdAt: "desc" }
                }
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

    // Add these items to the new meeting with preserved historical context
    for (const item of itemsToCarryOver) {
      const historicalContext = item.discussionNotes 
        ? `📝 Previous Discussion (${lastMeeting.title}):\n${item.discussionNotes}\n\n--- New Discussion ---\n`
        : `📝 Carried over from ${lastMeeting.title}\n\n--- Discussion ---\n`

      await db.meetingItem.create({
        data: {
          meetingId,
          issueId: item.issueId,
          carriedOver: true,
          discussionNotes: historicalContext
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

export async function endMeetingAndPrepareNext(meetingId: string, generalNotes?: string, externalHelp?: string) {
  try {
    // End the current meeting
    await endMeeting(meetingId, generalNotes, externalHelp)
    
    // Create a new meeting for next week automatically
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const newMeeting = await db.meeting.create({
      data: {
        title: `ERP Team Meeting - ${formatDateForMeetingTitle()}`,
        meetingDate: nextWeek,
        status: "PLANNED"
      }
    })

    // Add carried over items automatically (with historical notes preserved)
    await addCarriedOverItems(newMeeting.id)

    revalidatePath("/meetings")
    return newMeeting
  } catch (error) {
    console.error("Error ending meeting and preparing next:", error)
    throw new Error("Failed to end meeting and prepare next")
  }
}

export async function createNewMeetingManually(title: string, meetingDate: Date) {
  try {
    const newMeeting = await db.meeting.create({
      data: {
        title,
        meetingDate,
        status: "PLANNED"
      },
      include: {
        meetingItems: {
          include: {
            issue: {
              include: {
                category: true,
                additionalHelpNotes: {
                  orderBy: { createdAt: "desc" }
                },
                actionItems: {
                  orderBy: { priority: "desc" }
                },
                notes: {
                  orderBy: { createdAt: "desc" }
                },
                cmicNotes: {
                  orderBy: { createdAt: "desc" }
                }
              }
            }
          }
        }
      }
    })

    // Optionally add carried over items
    await addCarriedOverItems(newMeeting.id)

    revalidatePath("/meetings")
    return newMeeting
  } catch (error) {
    console.error("Error creating new meeting manually:", error)
    throw new Error("Failed to create new meeting")
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
  } catch (error) {
    console.error("Error adding issue to meeting:", error)
    throw new Error("Failed to add issue to meeting")
  }
}

export async function addMultipleIssuesToMeeting(prevState: unknown, formData: FormData) {
  try {
    const meetingId = formData.get("meetingId") as string
    const issueIds = formData.getAll("issueIds") as string[]

    console.log("Starting addMultipleIssuesToMeeting:", { meetingId, issueIds, timestamp: new Date().toISOString() })

    if (!meetingId) {
      console.error("No meetingId provided")
      return { error: "Meeting ID is required" }
    }

    if (!issueIds || issueIds.length === 0) {
      console.error("No issueIds provided")
      return { error: "At least one issue ID is required" }
    }

    // Verify meeting exists
    const meeting = await db.meeting.findUnique({
      where: { id: meetingId }
    })

    if (!meeting) {
      console.error("Meeting not found:", meetingId)
      return { error: "Meeting not found" }
    }

    console.log("Meeting found:", meeting.title)

    // Check for existing meeting items to avoid duplicates
    const existingItems = await db.meetingItem.findMany({
      where: {
        meetingId,
        issueId: { in: issueIds }
      }
    })

    const existingIssueIds = existingItems.map(item => item.issueId)
    const newIssueIds = issueIds.filter(id => !existingIssueIds.includes(id))

    console.log("Existing items:", existingIssueIds)
    console.log("New items to add:", newIssueIds)

    const createdItems = []
    for (const issueId of newIssueIds) {
      const item = await db.meetingItem.create({
        data: {
          meetingId,
          issueId,
          carriedOver: false
        }
      })
      createdItems.push(item)
      console.log("Created meeting item:", item.id)
    }

    console.log("Successfully added issues to meeting. Created items:", createdItems.length)

    // Revalidate multiple paths to ensure UI updates
    revalidatePath("/meetings")
    revalidatePath("/")
    
    return { 
      success: true, 
      message: `Added ${createdItems.length} issues to meeting${existingIssueIds.length > 0 ? ` (${existingIssueIds.length} already existed)` : ''}`
    }
  } catch (error) {
    console.error("Error adding issues to meeting:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })
    return { error: `Failed to add issues to meeting: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

export async function removeIssueFromMeeting(meetingId: string, issueId: string) {
  try {
    console.log("Starting removeIssueFromMeeting:", { meetingId, issueId, timestamp: new Date().toISOString() })

    // Verify meeting exists
    const meeting = await db.meeting.findUnique({
      where: { id: meetingId }
    })

    if (!meeting) {
      console.error("Meeting not found:", meetingId)
      throw new Error("Meeting not found")
    }

    console.log("Meeting found:", meeting.title)

    // Check if meeting item exists before deletion
    const existingItem = await db.meetingItem.findFirst({
      where: {
        meetingId,
        issueId
      }
    })

    if (!existingItem) {
      console.warn("Meeting item not found for removal:", { meetingId, issueId })
      return // No error, just exit since it's already not in the meeting
    }

    console.log("Removing meeting item:", existingItem.id)

    const result = await db.meetingItem.deleteMany({
      where: {
        meetingId,
        issueId
      }
    })

    console.log("Meeting item removal result:", { deletedCount: result.count })

    // Revalidate multiple paths to ensure UI updates
    revalidatePath("/meetings")
    revalidatePath("/")

    console.log("Successfully removed issue from meeting. Revalidation completed.")
  } catch (error) {
    console.error("Error removing issue from meeting:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })
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

export async function updateMeetingGeneralNotes(meetingId: string, generalNotes: string) {
  try {
    await db.meeting.update({
      where: {
        id: meetingId
      },
      data: {
        generalNotes
      }
    })

    revalidatePath("/meetings")
  } catch (error) {
    console.error("Error updating meeting general notes:", error)
    throw new Error("Failed to update general notes")
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
        category: true,
        additionalHelpNotes: {
          orderBy: { createdAt: "desc" }
        },
        actionItems: {
          orderBy: { priority: "desc" }
        },
        notes: {
          orderBy: { createdAt: "desc" }
        },
        cmicNotes: {
          orderBy: { createdAt: "desc" }
        }
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