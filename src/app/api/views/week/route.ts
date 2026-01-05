import { NextResponse } from "next/server"
import { getWeekTasks, getOverdueTasks, getLabelsForTask, getSubtasksByTaskId, getRemindersForTask } from "@/lib/db/operations"
import type { TaskWithRelations } from "@/lib/types"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeCompleted = searchParams.get("includeCompleted") === "true"

    // Get week's tasks
    const weekTasks = getWeekTasks()
    
    // Get overdue tasks
    const overdueTasks = getOverdueTasks()

    // Combine and transform tasks with relations
    const transformTask = (task: any): TaskWithRelations => ({
      ...task,
      labels: getLabelsForTask(task.id),
      subtasks: getSubtasksByTaskId(task.id),
      reminders: getRemindersForTask(task.id),
    })

    let allTasks = [
      ...overdueTasks.map(transformTask),
      ...weekTasks.map(transformTask),
    ]

    // Filter completed if not including them
    if (!includeCompleted) {
      allTasks = allTasks.filter((task) => !task.is_completed)
    }

    return NextResponse.json({
      tasks: allTasks,
      overdueCount: overdueTasks.length,
      weekCount: weekTasks.length,
    })
  } catch (error) {
    console.error("Error fetching week's tasks:", error)
    return NextResponse.json({ error: "Failed to fetch week's tasks" }, { status: 500 })
  }
}
