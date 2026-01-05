import { NextResponse } from "next/server"
import { getLabels, createLabel } from "@/lib/db/operations"

export async function GET() {
  try {
    const labels = getLabels()
    return NextResponse.json({ labels })
  } catch (error) {
    console.error("Error fetching labels:", error)
    return NextResponse.json({ error: "Failed to fetch labels" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const label = createLabel({
      name: data.name,
      color: data.color ?? null,
      icon: data.icon ?? null,
    })
    return NextResponse.json({ label })
  } catch (error) {
    console.error("Error creating label:", error)
    return NextResponse.json({ error: "Failed to create label" }, { status: 500 })
  }
}
