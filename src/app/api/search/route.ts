import { NextRequest, NextResponse } from "next/server"
import { searchTasksWithRelations, getLists, getLabels } from "@/lib/db/operations"
import type { TaskWithRelations, List, Label } from "@/lib/types"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q") || ""
  const type = searchParams.get("type") || "all" // all, tasks, lists, labels
  const completed = searchParams.get("completed") // "true", "false", or undefined
  const limit = parseInt(searchParams.get("limit") || "20")

  if (!query.trim()) {
    return NextResponse.json({
      tasks: [],
      lists: [],
      labels: [],
    })
  }

  try {
    const results: {
      tasks: (TaskWithRelations & { list: Pick<List, 'id' | 'name' | 'color' | 'emoji'> | null })[]
      lists: List[]
      labels: Label[]
    } = {
      tasks: [],
      lists: [],
      labels: [],
    }

    // Search tasks
    if (type === "all" || type === "tasks") {
      let tasks = searchTasksWithRelations(query)

      // Filter by completed status if specified
      if (completed === "true") {
        tasks = tasks.filter((t) => t.is_completed)
      } else if (completed === "false") {
        tasks = tasks.filter((t) => !t.is_completed)
      }

      // Get list info for each task
      const { getListById } = await import("@/lib/db/operations")
      tasks = tasks.slice(0, limit).map((task) => {
        const list = getListById(task.list_id)
        return {
          ...task,
          list: list ? { id: list.id, name: list.name, color: list.color, emoji: list.emoji } : null,
        }
      })

      results.tasks = tasks
    }

    // Search lists
    if (type === "all" || type === "lists") {
      const lists = getLists()
      const queryLower = query.toLowerCase()
      results.lists = lists
        .filter((list) => list.name.toLowerCase().includes(queryLower))
        .slice(0, limit)
    }

    // Search labels
    if (type === "all" || type === "labels") {
      const labels = getLabels()
      const queryLower = query.toLowerCase()
      results.labels = labels
        .filter((label) => label.name.toLowerCase().includes(queryLower))
        .slice(0, limit)
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
