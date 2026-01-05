"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useUIStore } from "@/store/ui-store"
import { TodayView } from "./TodayView"
import { WeekView } from "./WeekView"
import { UpcomingView } from "./UpcomingView"
import { AllView } from "./AllView"
import type { TaskWithRelations, List, Label, TaskLog } from "@/lib/types"

interface ViewContainerProps {
  onTaskEdit?: (task: TaskWithRelations) => void
  onTaskView?: (task: TaskWithRelations) => void
  onAddTask?: () => void
}

export function ViewContainer({ onTaskEdit, onTaskView, onAddTask }: ViewContainerProps) {
  const { currentView, setAddTaskOpen } = useUIStore()
  const [lists, setLists] = React.useState<List[]>([])
  const [labels, setLabels] = React.useState<Label[]>([])
  const [selectedList, setSelectedList] = React.useState<List | null>(null)

  // Load lists and labels
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const listsRes = await fetch("/api/lists")
        if (listsRes.ok) {
          const data = await listsRes.json()
          setLists(data.lists || [])
        }
        
        const labelsRes = await fetch("/api/labels")
        if (labelsRes.ok) {
          const data = await labelsRes.json()
          setLabels(data.labels || [])
        }
      } catch (error) {
        console.error("Failed to load lists and labels:", error)
      }
    }
    loadData()
  }, [])

  const renderView = () => {
    const viewProps = {
      onTaskEdit,
      onTaskView,
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
        // For list view, we can use TodayView as a base or create a ListView
        return (
          <TodayView 
            {...viewProps}
            key="list-view"
          />
        )
      default:
        return <TodayView {...viewProps} />
    }
  }

  const getViewTitle = () => {
    const viewTitles: Record<string, string> = {
      today: "📥 Today's Tasks",
      week: "📅 Next 7 Days",
      upcoming: "🔮 Upcoming",
      all: "📋 All Tasks",
      list: selectedList?.emoji 
        ? `${selectedList.emoji} ${selectedList.name}`
        : selectedList?.name || "Tasks",
    }
    return viewTitles[currentView] || "Tasks"
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        {renderView()}
      </motion.div>
    </AnimatePresence>
  )
}
