import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { question, videoId } = await request.json()

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // Fetch video context if videoId is provided
    let videoContext = ""
    if (videoId) {
      try {
        const video = await prisma.video.findUnique({
          where: { id: videoId },
          include: {
            channel: {
              select: {
                name: true,
              },
            },
            category: {
              select: {
                name: true,
              },
            },
          },
        })

        if (video) {
          videoContext = `Video Title: ${video.title}. Channel: ${video.channel.name}. ${
            video.description ? `Description: ${video.description.substring(0, 500)}` : ""
          }`
        }
      } catch (error) {
        console.error("Error fetching video context:", error)
      }
    }

    // Check if OpenAI API key is set
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using cheaper model, can upgrade to gpt-4 if needed
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant that answers questions about educational videos. 
                     You provide clear, concise, and accurate answers. 
                     ${videoContext ? `Context about the current video: ${videoContext}` : ""}
                     Keep your responses brief and conversational, suitable for voice output.`,
          },
          {
            role: "user",
            content: question,
          },
        ],
        max_tokens: 300, // Keep responses concise for voice
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("OpenAI API error:", errorData)
      return NextResponse.json(
        { error: "Failed to get AI response" },
        { status: response.status }
      )
    }

    const data = await response.json()
    const answer = data.choices?.[0]?.message?.content || "I couldn't generate a response."

    return NextResponse.json({ answer })
  } catch (error) {
    console.error("Error in AI ask route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

