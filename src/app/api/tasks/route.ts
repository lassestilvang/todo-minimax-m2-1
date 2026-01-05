import { NextResponse } from "next/server"
import {
  getTasksByListId,
  getTodayTasks,
  getWeekTasks,
  getUpcomingTasks,
  getAllTasks,
  getLabels,
  getListsWithTaskCount,
} from "@/lib/db/operations"
import type { ViewMode } from "@/lib/types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const view = (searchParams.get("view") as ViewMode) || "today"
  const listId = searchParams.get("listId")

  try {
    let tasks
    let list = null

    switch (view) {
      case "today":
        tasks = getTodayTasks()
        break
      case "week":
        tasks = getWeekTasks()
        break
      case "upcoming":
        tasks = getUpcomingTasks()
        break
      case "list":
        if (listId) {
          tasks = getTasksByListId(listId)
          const lists = getListsWithTaskCount()
          list = lists.find((l) => l.id === listId) || null
        } else {
          tasks = getAllTasks()
        }
        break
      case "all":
      default:
        tasks = getAllTasks()
        break
    }

    const lists = getListsWithTaskCount()
    const labels = getLabels()

    return NextResponse.json({
      tasks,
      lists,
      labels,
      currentList: list,
    })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}
