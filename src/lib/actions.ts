"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const CreateIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().transform(val => val || undefined),
  resolutionPlan: z.string().nullable().transform(val => val || undefined),
  workPerformed: z.string().nullable().transform(val => val || undefined),
  roadblocks: z.string().nullable().transform(val => val || undefined),
  usersInvolved: z.string().nullable().transform(val => val || undefined),
  additionalHelp: z.string().nullable().transform(val => val || undefined),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  categoryId: z.union([z.string(), z.undefined()]).transform(val => val || undefined),
  assignedTo: z.string().nullable().transform(val => val || undefined),
  cmicTicketNumber: z.string().nullable().transform(val => val || undefined),
  cmicTicketOpened: z.string().nullable().transform((val) => val ? new Date(val) : undefined),
  cmicTicketClosed: z.boolean().optional().default(false),
})

const CreateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
})

const CreateNoteSchema = z.object({
  issueId: z.string(),
  content: z.string().min(1, "Note content is required"),
  author: z.string().optional(),
})

const CreateCmicNoteSchema = z.object({
  issueId: z.string(),
  content: z.string().min(1, "Note content is required"),
  author: z.string().optional(),
})

const CreateAdditionalHelpNoteSchema = z.object({
  issueId: z.string(),
  content: z.string().min(1, "Note content is required"),
  author: z.string().optional(),
})

export async function createIssue(prevState: unknown, formData: FormData) {
  console.log("🔧 createIssue called with formData:", {
    title: formData.get("title"),
    priority: formData.get("priority"),
    status: formData.get("status"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
  })
  
  const categoryId = formData.get("categoryId")
  const data = {
    title: formData.get("title"),
    description: formData.get("description"),
    resolutionPlan: formData.get("resolutionPlan"),
    workPerformed: formData.get("workPerformed"),
    roadblocks: formData.get("roadblocks"),
    usersInvolved: formData.get("usersInvolved"),
    additionalHelp: formData.get("additionalHelp"),
    priority: formData.get("priority"),
    status: formData.get("status"),
    categoryId: categoryId === "none" ? undefined : categoryId || undefined,
    assignedTo: formData.get("assignedTo"),
    cmicTicketNumber: formData.get("cmicTicketNumber"),
    cmicTicketOpened: formData.get("cmicTicketOpened"),
    cmicTicketClosed: formData.get("cmicTicketClosed") === "true",
  }
  
  console.log("🔍 Data to validate:", data)
  
  const validatedFields = CreateIssueSchema.safeParse(data)
  
  console.log("✅ Validation result:", validatedFields.success ? "SUCCESS" : "FAILED")
  if (!validatedFields.success) {
    console.log("❌ Validation errors:", validatedFields.error?.issues)
  } else {
    console.log("✅ Validated data:", validatedFields.data)
  }

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    console.log("💾 Creating issue in database with data:", validatedFields.data)
    const issue = await db.issue.create({
      data: validatedFields.data,
    })
    console.log("🎉 Issue created successfully:", issue.id, issue.title)

    revalidatePath("/dashboard")
    console.log("✅ Revalidated /dashboard path")
    return { success: true, issue }
  } catch (error) {
    console.error("❌ Database error:", error)
    return {
      errors: { _form: ["Failed to create issue"] },
    }
  }
}

export async function updateIssue(id: string, prevState: unknown, formData: FormData) {
  const categoryId = formData.get("categoryId")
  const validatedFields = CreateIssueSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    resolutionPlan: formData.get("resolutionPlan"),
    workPerformed: formData.get("workPerformed"),
    roadblocks: formData.get("roadblocks"),
    usersInvolved: formData.get("usersInvolved"),
    additionalHelp: formData.get("additionalHelp"),
    priority: formData.get("priority"),
    status: formData.get("status"),
    categoryId: categoryId === "none" ? undefined : categoryId || undefined,
    assignedTo: formData.get("assignedTo"),
    cmicTicketNumber: formData.get("cmicTicketNumber"),
    cmicTicketOpened: formData.get("cmicTicketOpened"),
    cmicTicketClosed: formData.get("cmicTicketClosed") === "true",
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const issue = await db.issue.update({
      where: { id },
      data: validatedFields.data,
    })

    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/${id}`)
    return { success: true, issue }
  } catch (error) {
    return {
      errors: { _form: ["Failed to update issue"] },
    }
  }
}

export async function archiveIssue(id: string) {
  try {
    await db.issue.update({
      where: { id },
      data: {
        archived: true,
        archivedAt: new Date(),
      },
    })

    revalidatePath("/dashboard")
    redirect("/dashboard")
  } catch (error) {
    return {
      errors: { _form: ["Failed to archive issue"] },
    }
  }
}

export async function deleteIssue(id: string) {
  try {
    await db.issue.delete({
      where: { id },
    })

    revalidatePath("/dashboard")
    redirect("/dashboard")
  } catch (error) {
    return {
      errors: { _form: ["Failed to delete issue"] },
    }
  }
}

export async function createCategory(prevState: unknown, formData: FormData) {
  const validatedFields = CreateCategorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    color: formData.get("color"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const category = await db.category.create({
      data: validatedFields.data,
    })

    revalidatePath("/dashboard")
    return { success: true, category }
  } catch (error) {
    return {
      errors: { _form: ["Failed to create category"] },
    }
  }
}

export async function createNote(prevState: unknown, formData: FormData) {
  const validatedFields = CreateNoteSchema.safeParse({
    issueId: formData.get("issueId"),
    content: formData.get("content"),
    author: formData.get("author"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const note = await db.note.create({
      data: validatedFields.data,
    })

    revalidatePath(`/dashboard/${validatedFields.data.issueId}`)
    return { success: true, note }
  } catch (error) {
    return {
      errors: { _form: ["Failed to create note"] },
    }
  }
}

export async function createCmicNote(prevState: unknown, formData: FormData) {
  const validatedFields = CreateCmicNoteSchema.safeParse({
    issueId: formData.get("issueId"),
    content: formData.get("content"),
    author: formData.get("author"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    // Clean up email formatting if content looks like email content
    const cleanedContent = cleanEmailContent(validatedFields.data.content)
    
    const cmicNote = await db.cmicNote.create({
      data: {
        ...validatedFields.data,
        content: cleanedContent,
      },
    })

    revalidatePath(`/dashboard/${validatedFields.data.issueId}`)
    return { success: true, cmicNote }
  } catch (error) {
    return {
      errors: { _form: ["Failed to create CMiC note"] },
    }
  }
}

export async function createAdditionalHelpNote(prevState: unknown, formData: FormData) {
  const validatedFields = CreateAdditionalHelpNoteSchema.safeParse({
    issueId: formData.get("issueId"),
    content: formData.get("content"),
    author: formData.get("author"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const additionalHelpNote = await db.additionalHelpNote.create({
      data: validatedFields.data,
    })

    revalidatePath(`/dashboard/${validatedFields.data.issueId}`)
    revalidatePath("/meetings")
    return { success: true, additionalHelpNote }
  } catch (error) {
    return {
      errors: { _form: ["Failed to create Additional Help note"] },
    }
  }
}

export async function deleteAdditionalHelpNote(noteId: string, issueId: string) {
  try {
    await db.additionalHelpNote.delete({
      where: { id: noteId },
    })

    revalidatePath(`/dashboard/${issueId}`)
    revalidatePath("/meetings")
    return { success: true }
  } catch (error) {
    return {
      errors: { _form: ["Failed to delete Additional Help note"] },
    }
  }
}

// Helper function to clean email content formatting
function cleanEmailContent(content: string): string {
  // Remove email headers and signatures
  const cleaned = content
    .replace(/^(From|To|Sent|Subject|Cc|Bcc):.*$/gm, '') // Remove email headers
    .replace(/^>.*$/gm, '') // Remove quoted text (replies)
    .replace(/^\s*-{2,}.*$/gm, '') // Remove signature separators
    .replace(/^Sent from my.*$/gm, '') // Remove mobile signatures
    .replace(/^Get Outlook for.*$/gm, '') // Remove Outlook signatures
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
    .trim()

  return cleaned
}

export async function getIssues() {
  try {
    const issues = await db.issue.findMany({
      where: {
        archived: false,
        status: {
          in: ["OPEN", "IN_PROGRESS"]
        }
      },
      include: {
        category: true,
        notes: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { notes: true },
        },
      },
      orderBy: [
        { priority: "desc" },
        { updatedAt: "desc" },
      ],
    })

    return issues
  } catch (error) {
    return []
  }
}

export async function getResolvedIssues() {
  try {
    const issues = await db.issue.findMany({
      where: {
        archived: false,
        status: {
          in: ["RESOLVED", "CLOSED"]
        }
      },
      include: {
        category: true,
        notes: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { notes: true },
        },
      },
      orderBy: [
        { updatedAt: "desc" },
      ],
    })

    return issues
  } catch (error) {
    return []
  }
}

export async function getIssue(id: string) {
  try {
    const issue = await db.issue.findUnique({
      where: { id },
      include: {
        category: true,
        notes: {
          orderBy: { createdAt: "desc" },
        },
        cmicNotes: {
          orderBy: { createdAt: "desc" },
        },
        additionalHelpNotes: {
          orderBy: { createdAt: "desc" },
        },
        actionItems: {
          where: {
            OR: [
              { issueId: id },
              { originalIssueId: id }
            ]
          },
          orderBy: [
            { completed: "asc" },
            { priority: "desc" },
            { createdAt: "desc" },
          ],
        },
      },
    })

    return issue
  } catch (error) {
    return null
  }
}

export async function getCategories() {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: { issues: true },
        },
      },
      orderBy: { name: "asc" },
    })

    return categories
  } catch (error) {
    return []
  }
}