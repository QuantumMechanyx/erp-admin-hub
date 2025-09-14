import { NextRequest, NextResponse } from "next/server"
import { getOpenAIClient, isOpenAIEnabled } from "@/lib/openai-config"

export async function POST(request: NextRequest) {
  try {
    if (!isOpenAIEnabled()) {
      return NextResponse.json(
        { error: "AI features are disabled. OpenAI API key not configured." },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { action, content, context } = body

    if (!action || !content) {
      return NextResponse.json(
        { error: "Missing required fields: action and content" },
        { status: 400 }
      )
    }

    const openai = getOpenAIClient()
    if (!openai) {
      return NextResponse.json(
        { error: "Failed to initialize OpenAI client" },
        { status: 500 }
      )
    }

    let prompt = ""
    let systemPrompt = "You are an expert email communication assistant for ERP system administrators. Provide professional, clear, and actionable responses."

    switch (action) {
      case "improve":
        prompt = `Please improve this email draft while maintaining its professional tone and key information. Focus on clarity, structure, and readability:\n\n${content}`
        break
      
      case "shorten":
        prompt = `Please make this email more concise while preserving all essential information:\n\n${content}`
        break
      
      case "formal":
        prompt = `Please rewrite this email in a more formal, professional tone:\n\n${content}`
        break
      
      case "conversational":
        prompt = `Please rewrite this email in a more conversational, friendly tone while maintaining professionalism:\n\n${content}`
        break
      
      case "analyze":
        prompt = `Please analyze this email draft and provide feedback on:\n1. Clarity and readability\n2. Professional tone\n3. Structure and organization\n4. Completeness of information\n5. Suggested improvements\n\nEmail content:\n${content}`
        systemPrompt = "You are an expert email communication analyst. Provide constructive feedback with specific, actionable recommendations."
        break
      
      case "generate_subject":
        prompt = `Based on this email content, suggest 3 professional subject lines that are clear, specific, and compelling:\n\n${content}`
        break
      
      case "grammar_check":
        prompt = `Please check this email for grammar, spelling, and punctuation errors. Provide the corrected version and list any changes made:\n\n${content}`
        break
      
      case "custom":
        if (!context?.instruction) {
          return NextResponse.json(
            { error: "Custom action requires an instruction in context" },
            { status: 400 }
          )
        }
        prompt = `${context.instruction}\n\nEmail content:\n${content}`
        break
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Supported actions: improve, shorten, formal, conversational, analyze, generate_subject, grammar_check, custom` },
          { status: 400 }
        )
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using the more cost-effective model for most operations
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const result = response.choices[0]?.message?.content

    if (!result) {
      return NextResponse.json(
        { error: "No response generated from OpenAI" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      action,
      original_content: content,
      result,
      usage: response.usage
    })

  } catch (error) {
    console.error("AI email processing error:", error)
    
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "Invalid OpenAI API key" },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: `AI processing failed: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Unknown error occurred during AI processing" },
      { status: 500 }
    )
  }
}