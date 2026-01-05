import { NextResponse } from "next/server"
import { getUpcomingTasks, getOverdueTasks, getLabelsForTask, getSubtasksByTaskId, getRemindersForTask } from "@/lib/db/operations"
import type { Task, TaskWithRelations } from "@/lib/types"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeCompleted = searchParams.get("includeCompleted") === "true"

    // Get upcoming tasks
    const upcomingTasks = getUpcomingTasks()
    
    // Get overdue tasks
    const overdueTasks = getOverdueTasks()

    // Combine and transform tasks with relations
    const transformTask = (task: Task): TaskWithRelations => ({
      ...task,
      labels: getLabelsForTask(task.id),
      subtasks: getSubtasksByTaskId(task.id),
      reminders: getRemindersForTask(task.id),
    })

    let allTasks = [
      ...overdueTasks.map(transformTask),
      ...upcomingTasks.map(transformTask),
    ]

    // Filter completed if not including them
    if (!includeCompleted) {
      allTasks = allTasks.filter((task) => !task.is_completed)
    }

    return NextResponse.json({
      tasks: allTasks,
      overdueCount: overdueTasks.length,
      upcomingCount: upcomingTasks.length,
    })
  } catch (error) {
    console.error("Error fetching upcoming tasks:", error)
    return NextResponse.json({ error: "Failed to fetch upcoming tasks" }, { status: 500 })
  }
}
