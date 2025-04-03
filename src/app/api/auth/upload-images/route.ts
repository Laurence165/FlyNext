import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { authenticateToken } from "@/app/api/middleware"
import { existsSync } from 'fs'

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, need raw body for FormData
  },
}

export async function POST(req: Request) {
  try {
    // Uncomment authentication once upload is working
    // const user = await authenticateToken(req)
    // if (user instanceof Response) return user

    const formData = await req.formData()
    const type = formData.get("type")
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Add some debugging
    console.log("File received:", {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', type as string)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
      console.log("Created directory:", uploadDir)
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    const filePath = join(uploadDir, fileName)

    try {
      await writeFile(filePath, buffer)
      console.log("File written successfully to:", filePath)
    } catch (error) {
      console.error("File write failed:", error)
      return NextResponse.json({ error: "Failed to save file" }, { status: 500 })
    }

    return NextResponse.json({ 
      url: `/${type}/${fileName}`,
      success: true
    })

  } catch (error) {
    console.error("Error in upload handler:", error)
    return NextResponse.json(
      { error: "Failed to upload image", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}