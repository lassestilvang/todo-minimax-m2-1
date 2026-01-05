import { NextResponse } from "next/server"
import { getListsWithTaskCount, getOverdueTaskCount } from "@/lib/db/operations"

export async function GET() {
  try {
    const lists = getListsWithTaskCount()
    const overdueCount = getOverdueTaskCount()
    
    return NextResponse.json({
      lists,
      overdueCount,
    })
  } catch (error) {
    console.error("Failed to fetch lists:", error)
    return NextResponse.json(
      { error: "Failed to fetch lists" },
      { status: 500 }
    )
  }
}
