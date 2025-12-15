import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      )
    }

    // Get the audio file from the request
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      )
    }

    // Convert File to a format OpenAI can use
    const audioBuffer = await audioFile.arrayBuffer()
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type })

    // Create a File object for OpenAI (they expect a File with a name)
    const audioFileForOpenAI = new File(
      [audioBlob],
      audioFile.name || "recording.webm",
      { type: audioFile.type || "audio/webm" }
    )

    // Transcribe using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFileForOpenAI,
      model: "whisper-1",
      language: "en", // Optional: specify language for better accuracy
    })

    return NextResponse.json({
      transcript: transcription.text,
    })
  } catch (error: any) {
    console.error("Transcription error:", error)
    return NextResponse.json(
      {
        error: "Failed to transcribe audio",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

