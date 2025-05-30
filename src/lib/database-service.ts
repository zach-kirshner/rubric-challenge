import { prisma } from './prisma'
import logger from './logger'

export interface DatabaseSubmission {
  id: string
  userId: string
  email: string
  fullName: string
  prompt: string
  status: string
  submittedAt: Date
  createdAt: Date
  criteria: any[]
  criteriaActions: any[]
  stats: {
    originalCount: number
    finalCount: number
    deletedCount: number
    editedCount: number
    addedCount: number
  }
  gradingResult: any | null
  gradedAt: Date | null
}

class DatabaseService {
  async createUser(email: string, fullName: string) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        // Update fullName if it's different
        if (existingUser.fullName !== fullName) {
          return await prisma.user.update({
            where: { email },
            data: { fullName }
          })
        }
        return existingUser
      }

      // Create new user
      return await prisma.user.create({
        data: {
          email,
          fullName
        }
      })
    } catch (error) {
      logger.error('Error creating/updating user', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async addSubmission(submissionData: any) {
    try {
      // First ensure the user exists
      const user = await this.createUser(submissionData.email, submissionData.fullName)

      // Create the submission
      const submission = await prisma.submission.create({
        data: {
          id: submissionData.id,
          userId: user.id,
          prompt: submissionData.prompt,
          status: submissionData.status,
          submittedAt: submissionData.submittedAt,
          criteria: {
            create: submissionData.criteria.map((criterion: any) => ({
              id: criterion.id,
              originalId: criterion.originalId,
              text: criterion.text,
              isPositive: criterion.isPositive,
              source: criterion.source,
              status: criterion.status,
              finalText: criterion.finalText,
              order: criterion.order
            }))
          },
          criteriaActions: {
            create: submissionData.criteriaActions.map((action: any) => ({
              id: action.id,
              criterionId: action.criterionId,
              actionType: action.actionType,
              previousText: action.previousText,
              newText: action.newText,
              previousOrder: action.previousOrder,
              newOrder: action.newOrder,
              justification: action.justification,
              timestamp: action.timestamp
            }))
          }
        },
        include: {
          user: true,
          criteria: true,
          criteriaActions: true
        }
      })

      logger.info(`Submission ${submission.id} saved to database for user ${user.email}`)
      return this.formatSubmission(submission)
    } catch (error) {
      logger.error('Error saving submission to database', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async getSubmission(id: string): Promise<DatabaseSubmission | null> {
    try {
      const submission = await prisma.submission.findUnique({
        where: { id },
        include: {
          user: true,
          criteria: true,
          criteriaActions: true
        }
      })

      if (!submission) return null
      return this.formatSubmission(submission)
    } catch (error) {
      logger.error('Error fetching submission from database', error instanceof Error ? error.message : String(error))
      return null
    }
  }

  async getAllSubmissions(): Promise<DatabaseSubmission[]> {
    try {
      const submissions = await prisma.submission.findMany({
        include: {
          user: true,
          criteria: true,
          criteriaActions: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return submissions.map(submission => this.formatSubmission(submission))
    } catch (error) {
      logger.error('Error fetching submissions from database', error instanceof Error ? error.message : String(error))
      return []
    }
  }

  // Optimized method for dashboard - only fetches necessary data
  async getDashboardSubmissions(): Promise<any[]> {
    try {
      const submissions = await prisma.submission.findMany({
        select: {
          id: true,
          userId: true,
          prompt: true,
          status: true,
          submittedAt: true,
          gradingResult: true,
          gradedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          },
          // Only count actions, don't fetch all data
          _count: {
            select: {
              criteriaActions: true,
              criteria: true
            }
          },
          // Only fetch aggregated criteria stats
          criteria: {
            select: {
              source: true,
              status: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        },
        // Limit to last 500 submissions for performance
        take: 500
      })

      return submissions.map(submission => {
        // Calculate stats from minimal criteria data
        const stats = {
          originalCount: submission.criteria.filter((c: any) => c.source === 'ai_generated').length,
          finalCount: submission.criteria.filter((c: any) => c.status !== 'deleted').length,
          deletedCount: submission.criteria.filter((c: any) => c.status === 'deleted').length,
          editedCount: submission.criteria.filter((c: any) => c.status === 'edited').length,
          addedCount: submission.criteria.filter((c: any) => c.source === 'user_added').length,
        }

        return {
          id: submission.id,
          userId: submission.userId,
          email: submission.user.email,
          fullName: submission.user.fullName,
          prompt: submission.prompt,
          status: submission.status,
          submittedAt: submission.submittedAt,
          gradingResult: submission.gradingResult,
          gradedAt: submission.gradedAt,
          stats,
          totalActions: submission._count.criteriaActions
        }
      })
    } catch (error) {
      logger.error('Error fetching dashboard submissions', error instanceof Error ? error.message : String(error))
      return []
    }
  }

  async updateSubmission(id: string, updates: any) {
    try {
      const submission = await prisma.submission.update({
        where: { id },
        data: {
          gradingResult: updates.gradingResult,
          gradedAt: updates.gradedAt || new Date()
        },
        include: {
          user: true,
          criteria: true,
          criteriaActions: true
        }
      })

      logger.info(`Submission ${id} updated in database`)
      return this.formatSubmission(submission)
    } catch (error) {
      logger.error('Error updating submission in database', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  private formatSubmission(submission: any): DatabaseSubmission {
    // Calculate stats
    const stats = {
      originalCount: submission.criteria.filter((c: any) => c.source === 'ai_generated').length,
      finalCount: submission.criteria.filter((c: any) => c.status !== 'deleted').length,
      deletedCount: submission.criteria.filter((c: any) => c.status === 'deleted').length,
      editedCount: submission.criteria.filter((c: any) => c.status === 'edited').length,
      addedCount: submission.criteria.filter((c: any) => c.source === 'user_added').length,
    }

    return {
      id: submission.id,
      userId: submission.userId,
      email: submission.user.email,
      fullName: submission.user.fullName,
      prompt: submission.prompt,
      status: submission.status,
      submittedAt: submission.submittedAt,
      createdAt: submission.createdAt,
      criteria: submission.criteria,
      criteriaActions: submission.criteriaActions,
      stats,
      gradingResult: submission.gradingResult,
      gradedAt: submission.gradedAt
    }
  }
}

// Create a singleton instance
const databaseService = new DatabaseService()

export default databaseService 