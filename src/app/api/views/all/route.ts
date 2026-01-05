import { NextResponse } from "next/server"
import { getAllTasks, getOverdueTasks, getLabelsForTask, getSubtasksByTaskId, getRemindersForTask } from "@/lib/db/operations"
import type { TaskWithRelations } from "@/lib/types"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeCompleted = searchParams.get("includeCompleted") === "true"

    // Get all tasks
    const allTasksData = getAllTasks()
    
    // Get overdue tasks
    const overdueTasks = getOverdueTasks()

    // Transform tasks with relations
    const transformTask = (task: any): TaskWithRelations => ({
      ...task,
      labels: getLabelsForTask(task.id),
      subtasks: getSubtasksByTaskId(task.id),
      reminders: getRemindersForTask(task.id),
    })

    let allTasks = allTasksData.map(transformTask)

    // Filter completed if not including them
    if (!includeCompleted) {
      allTasks = allTasks.filter((task) => !task.is_completed)
    }

    const completedCount = allTasksData.filter((t: any) => t.is_completed).length

    return NextResponse.json({
      tasks: allTasks,
      overdueCount: overdueTasks.length,
      completedCount,
      totalCount: allTasksData.length,
    })
  } catch (error) {
    console.error("Error fetching all tasks:", error)
    return NextResponse.json({ error: "Failed to fetch all tasks" }, { status: 500 })
  }
}
