import { NextResponse } from "next/server"
import { getTodayTasks, getOverdueTasks, getLabelsForTask, getSubtasksByTaskId, getRemindersForTask } from "@/lib/db/operations"
import type { Task, TaskWithRelations } from "@/lib/types"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeCompleted = searchParams.get("includeCompleted") === "true"

    // Get today's tasks
    const todayTasks = getTodayTasks()
    
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
      ...todayTasks.map(transformTask),
    ]

    // Filter completed if not including them
    if (!includeCompleted) {
      allTasks = allTasks.filter((task) => !task.is_completed)
    }

    return NextResponse.json({
      tasks: allTasks,
      overdueCount: overdueTasks.length,
      todayCount: todayTasks.length,
    })
  } catch (error) {
    console.error("Error fetching today's tasks:", error)
    return NextResponse.json({ error: "Failed to fetch today's tasks" }, { status: 500 })
  }
}
