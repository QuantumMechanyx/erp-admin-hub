import OpenAI from 'openai'

let openai: OpenAI | null = null

export function initializeOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not found. AI features will be disabled.')
    return null
  }

  // Debug logging for production
  console.log('OpenAI API key found, length:', process.env.OPENAI_API_KEY.length)
  console.log('OpenAI API key starts with:', process.env.OPENAI_API_KEY.substring(0, 20) + '...')

  if (!openai) {
    try {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
      console.log('OpenAI client initialized successfully')
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error)
      return null
    }
  }

  return openai
}

export function getOpenAIClient() {
  return openai || initializeOpenAI()
}

export const isOpenAIEnabled = () => {
  return !!process.env.OPENAI_API_KEY
}