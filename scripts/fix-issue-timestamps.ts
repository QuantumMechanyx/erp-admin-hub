#!/usr/bin/env tsx

/**
 * Migration script to fix timestamp discrepancies between issues and their notes
 *
 * This script:
 * 1. Finds all issues that have notes with timestamps newer than the issue's updatedAt
 * 2. Updates each issue's updatedAt to match the timestamp of its most recent note
 * 3. Ensures chronological consistency across all historical data
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

interface IssueWithDiscrepancy {
  id: string
  title: string
  updatedAt: Date
  latestNoteDate: Date
  discrepancyMinutes: number
}

async function findIssuesWithTimestampDiscrepancies(): Promise<IssueWithDiscrepancy[]> {
  console.log('🔍 Scanning for timestamp discrepancies...')

  // Get all issues with their notes, additionalHelpNotes, and cmicNotes
  const issues = await db.issue.findMany({
    include: {
      notes: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      additionalHelpNotes: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      cmicNotes: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  const discrepancies: IssueWithDiscrepancy[] = []

  for (const issue of issues) {
    // Find the latest timestamp among all note types
    const timestamps: Date[] = []

    if (issue.notes.length > 0) {
      timestamps.push(issue.notes[0].createdAt)
    }
    if (issue.additionalHelpNotes.length > 0) {
      timestamps.push(issue.additionalHelpNotes[0].createdAt)
    }
    if (issue.cmicNotes.length > 0) {
      timestamps.push(issue.cmicNotes[0].createdAt)
    }

    if (timestamps.length > 0) {
      const latestNoteDate = new Date(Math.max(...timestamps.map(t => t.getTime())))

      // Check if the latest note is newer than the issue's updatedAt
      if (latestNoteDate > issue.updatedAt) {
        const discrepancyMs = latestNoteDate.getTime() - issue.updatedAt.getTime()
        const discrepancyMinutes = Math.round(discrepancyMs / (1000 * 60))

        discrepancies.push({
          id: issue.id,
          title: issue.title,
          updatedAt: issue.updatedAt,
          latestNoteDate,
          discrepancyMinutes
        })
      }
    }
  }

  return discrepancies
}

async function fixTimestampDiscrepancies(dryRun: boolean = true): Promise<void> {
  try {
    const discrepancies = await findIssuesWithTimestampDiscrepancies()

    if (discrepancies.length === 0) {
      console.log('✅ No timestamp discrepancies found!')
      return
    }

    console.log(`\n📊 Found ${discrepancies.length} issues with timestamp discrepancies:`)
    console.log('─'.repeat(100))
    console.log('Issue ID'.padEnd(30) + 'Title'.padEnd(40) + 'Discrepancy'.padEnd(15) + 'Will Update To')
    console.log('─'.repeat(100))

    for (const issue of discrepancies) {
      const discrepancyText = `+${issue.discrepancyMinutes}m`
      console.log(
        issue.id.slice(0, 28).padEnd(30) +
        issue.title.slice(0, 38).padEnd(40) +
        discrepancyText.padEnd(15) +
        issue.latestNoteDate.toISOString()
      )
    }

    if (dryRun) {
      console.log('\n🔍 DRY RUN - No changes made')
      console.log('Run with --fix flag to apply changes')
      return
    }

    console.log('\n🔧 Applying fixes...')

    let successCount = 0
    let errorCount = 0

    for (const issue of discrepancies) {
      try {
        await db.issue.update({
          where: { id: issue.id },
          data: { updatedAt: issue.latestNoteDate }
        })
        successCount++
        console.log(`✅ Fixed: ${issue.title.slice(0, 50)}...`)
      } catch (error) {
        errorCount++
        console.error(`❌ Error fixing ${issue.id}: ${error}`)
      }
    }

    console.log('\n📈 Migration Summary:')
    console.log(`✅ Successfully fixed: ${successCount} issues`)
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} issues`)
    }
    console.log('🎉 Migration completed!')

  } catch (error) {
    console.error('💥 Migration failed:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const shouldFix = args.includes('--fix')

  console.log('🚀 Issue Timestamp Migration Tool')
  console.log('=' .repeat(50))

  if (!shouldFix) {
    console.log('Running in DRY RUN mode...')
  }

  await fixTimestampDiscrepancies(!shouldFix)
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
}

export { fixTimestampDiscrepancies, findIssuesWithTimestampDiscrepancies }