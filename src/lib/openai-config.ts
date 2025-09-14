import OpenAI from 'openai'

let openai: OpenAI | null = null

export function initializeOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not found. AI features will be disabled.')
    return null
  }

  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return openai
}

export function getOpenAIClient() {
  return openai || initializeOpenAI()
}

export const isOpenAIEnabled = () => {
  return !!process.env.OPENAI_API_KEY
}