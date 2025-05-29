import fs from 'fs'
import path from 'path'
import logger from './logger'

const SUBMISSIONS_FILE = path.join(process.cwd(), '.submissions.json')

export interface StoredSubmission {
  id: string
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

class SubmissionsStore {
  private submissions: StoredSubmission[] = []

  constructor() {
    this.loadSubmissions()
  }

  private loadSubmissions() {
    try {
      if (fs.existsSync(SUBMISSIONS_FILE)) {
        const data = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8')
        this.submissions = JSON.parse(data)
        logger.info(`Loaded ${this.submissions.length} submissions from storage`)
      }
    } catch (error) {
      logger.error('Error loading submissions from file', error instanceof Error ? error.message : String(error))
      this.submissions = []
    }
  }

  private saveSubmissions() {
    try {
      fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(this.submissions, null, 2))
      logger.info(`Saved ${this.submissions.length} submissions to storage`)
    } catch (error) {
      logger.error('Error saving submissions to file', error instanceof Error ? error.message : String(error))
    }
  }

  addSubmission(submission: StoredSubmission) {
    this.submissions.push(submission)
    this.saveSubmissions()
  }

  updateSubmission(id: string, updates: Partial<StoredSubmission>) {
    const index = this.submissions.findIndex(s => s.id === id)
    if (index !== -1) {
      this.submissions[index] = { ...this.submissions[index], ...updates }
      this.saveSubmissions()
    }
  }

  getSubmission(id: string): StoredSubmission | undefined {
    return this.submissions.find(s => s.id === id)
  }

  getAllSubmissions(): StoredSubmission[] {
    return this.submissions
  }

  clearSubmissions() {
    this.submissions = []
    this.saveSubmissions()
  }
}

// Create a singleton instance
const submissionsStore = new SubmissionsStore()

export default submissionsStore 