"use client"

import * as React from "react"
import { useEffect, useState, useCallback } from "react"
import { format } from "date-fns"
import { RefreshCw, Plus } from "lucide-react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import { useUIStore } from "@/store/ui-store"
import { ViewToggle, ViewToggleCompact } from "@/components/ui/ViewToggle"
import { TodayView } from "@/components/views/TodayView"
import { WeekView } from "@/components/views/WeekView"
import { UpcomingView } from "@/components/views/UpcomingView"
import { AllView } from "@/components/views/AllView"
import { TaskForm } from "@/components/tasks/TaskForm"
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog"
import { QuickAddTask } from "@/components/tasks/QuickAddTask"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Circle } from "lucide-react"
import type { TaskWithRelations, List, Label, TaskLog, ListWithTaskCount } from "@/lib/types"

export default function Home() {
  const { currentView, setAddTaskOpen, showCompletedTasks, selectedListId } = useUIStore()
  const [isLoading, setIsLoading] = useState(true)
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [lists, setLists] = useState<ListWithTaskCount[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [selectedList, setSelectedList] = useState<List | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null)
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [overdueCount, setOverdueCount] = useState(0)

  // Fetch tasks based on current view
  const loadTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("view", currentView)
      if (currentView === "list" && selectedListId) {
        params.set("listId", selectedListId)
      }

      const response = await fetch(`/api/tasks?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
        setLists(data.lists || [])
        setLabels(data.labels || [])
        setSelectedList(data.currentList || null)
      } else {
        throw new Error("Failed to fetch tasks")
      }
    } catch (error) {
      console.error("Failed to load tasks:", error)
      setTasks([])
      setLists([])
      setLabels([])
    } finally {
      setIsLoading(false)
    }
  }, [currentView, selectedListId])

  // Load tasks on mount and when view changes
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Load overdue count
  useEffect(() => {
    const loadOverdueCount = async () => {
      try {
        const response = await fetch("/api/tasks/overdue-count")
        if (response.ok) {
          const data = await response.json()
          setOverdueCount(data.count || 0)
        }
      } catch (error) {
        console.error("Failed to load overdue count:", error)
      }
    }
    loadOverdueCount()
  }, [])

  // Get page title based on current view
  const getPageTitle = () => {
    if (currentView === "list" && selectedList) {
      return selectedList.emoji 
        ? `${selectedList.emoji} ${selectedList.name}`
        : selectedList.name
    }
    
    const viewTitles: Record<string, string> = {
      today: "📥 Today's Tasks",
      week: "📅 Next 7 Days",
      upcoming: "🔮 Upcoming",
      all: "📋 All Tasks",
    }
    
    return viewTitles[currentView] || "Tasks"
  }

  const handleTaskEdit = (task: TaskWithRelations) => {
    setSelectedTask(task)
    setIsFormOpen(true)
  }

  const handleTaskView = (task: TaskWithRelations) => {
    setSelectedTask(task)
    // Fetch logs for this task
    fetch(`/api/tasks/${task.id}/logs`)
      .then((res) => res.json())
      .then((data) => setTaskLogs(data.logs || []))
      .catch(console.error)
    setIsDetailOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setSelectedTask(null)
    loadTasks() // Refresh tasks
  }

  const handleDetailClose = () => {
    setIsDetailOpen(false)
    setSelectedTask(null)
    setTaskLogs([])
    loadTasks() // Refresh tasks
  }

  const handleTaskCreated = () => {
    loadTasks()
  }

  // Get default list ID for quick add
  const getDefaultListId = () => {
    if (currentView === "list" && selectedListId) {
      return selectedListId
    }
    const defaultList = lists.find((l) => l.is_default)
    return defaultList?.id || lists[0]?.id || ""
  }

  // Filter tasks for display
  const filteredTasks = React.useMemo(() => {
    if (showCompletedTasks) return tasks
    return tasks.filter((t) => !t.is_completed)
  }, [tasks, showCompletedTasks])

  const taskCount = filteredTasks.length

  if (isLoading) {
    return (
      <MainLayout>
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    )
  }

  const renderView = () => {
    const viewProps = {
      onTaskEdit: handleTaskEdit,
      onTaskView: handleTaskView,
      onAddTask: () => setAddTaskOpen(true),
    }

    switch (currentView) {
      case "today":
        return <TodayView {...viewProps} />
      case "week":
        return <WeekView {...viewProps} />
      case "upcoming":
        return <UpcomingView {...viewProps} />
      case "all":
        return <AllView {...viewProps} />
      case "list":
        return <TodayView {...viewProps} />
      default:
        return <TodayView {...viewProps} />
    }
  }

  return (
    <MainLayout>
      <Header taskCount={taskCount} overdueCount={overdueCount} />
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar lists={lists} overdueCount={overdueCount} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* View Toggle - Mobile */}
            <div className="md:hidden mb-4">
              <ViewToggleCompact />
            </div>

            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="hidden sm:flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight">
                  {getPageTitle()}
                </h1>
                <p className="text-muted-foreground">
                  {format(new Date(), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
              
              {/* View Toggle - Desktop */}
              <ViewToggle className="hidden md:flex" />
            </div>

            {/* Quick Add Task */}
            <QuickAddTask
              defaultListId={getDefaultListId()}
              lists={lists.map(l => ({ id: l.id, name: l.name, color: l.color, emoji: l.emoji, is_default: l.is_default, created_at: l.created_at, updated_at: l.updated_at }))}
              placeholder="Add a task..."
              autoFocus={false}
              onTaskCreated={handleTaskCreated}
            />

            {/* Tasks View */}
            <div className="mt-6">
              {renderView()}
            </div>

            {/* Quick Stats */}
            {!isLoading && tasks.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3 mt-8">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Circle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Pending</p>
                      <p className="text-2xl font-bold">
                        {tasks.filter((t) => !t.is_completed).length}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Circle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Completed</p>
                      <p className="text-2xl font-bold">
                        {tasks.filter((t) => t.is_completed).length}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Plus className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Due Today</p>
                      <p className="text-2xl font-bold">
                        {tasks.filter((t) => {
                          if (!t.date) return false
                          const today = new Date().toISOString().split("T")[0]
                          return t.date === today && !t.is_completed
                        }).length}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Task Form Dialog */}
      <TaskForm
        task={selectedTask}
        lists={lists.map(l => ({ id: l.id, name: l.name, color: l.color, emoji: l.emoji, is_default: l.is_default, created_at: l.created_at, updated_at: l.updated_at }))}
        allLabels={labels}
        open={isFormOpen}
        onOpenChange={handleFormClose}
        defaultListId={getDefaultListId()}
      />

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        logs={taskLogs}
        open={isDetailOpen}
        onOpenChange={handleDetailClose}
        onEdit={() => {
          setIsDetailOpen(false)
          setIsFormOpen(true)
        }}
      />
    </MainLayout>
  )
}
