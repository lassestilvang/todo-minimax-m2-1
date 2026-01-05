import { NextResponse } from "next/server"
import { getLogsForTask } from "@/lib/db/operations"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const logs = getLogsForTask(id)
    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Error fetching task logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch task logs" },
      { status: 500 }
    )
  }
}
