import { NextResponse } from "next/server"
import { getOverdueTaskCount } from "@/lib/db/operations"

export async function GET() {
  try {
    const count = getOverdueTaskCount()
    return NextResponse.json({ count })
  } catch (error) {
    console.error("Error fetching overdue count:", error)
    return NextResponse.json({ error: "Failed to fetch overdue count" }, { status: 500 })
  }
}
