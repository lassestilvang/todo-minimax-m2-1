"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useUIStore } from "@/store/ui-store"
import { Header } from "./Header"
import { SidebarClient } from "./SidebarClient"
import { SearchCommand } from "@/components/search/SearchCommand"
import { cn } from "@/lib/utils"
import type { ListWithTaskCount } from "@/lib/types"

interface MainLayoutProps {
  children: React.ReactNode
  initialLists?: ListWithTaskCount[]
  overdueCount?: number
}

export function MainLayout({ children, initialLists = [], overdueCount = 0 }: MainLayoutProps) {
  const { sidebarOpen } = useUIStore()
  const [lists, setLists] = React.useState<ListWithTaskCount[]>(initialLists)
  const [overdue, setOverdue] = React.useState(overdueCount)

  // Fetch lists on mount
  React.useEffect(() => {
    const fetchLists = async () => {
      try {
        const response = await fetch("/api/lists")
        if (response.ok) {
          const data = await response.json()
          setLists(data.lists || [])
        }
      } catch (error) {
        console.error("Failed to fetch lists:", error)
      }
    }
    fetchLists()
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarClient initialLists={lists} overdueCount={overdue} />
      <div className="flex flex-1 flex-col min-h-screen">
        <Header
          onMenuClick={() => {
            useUIStore.getState().toggleSidebar()
          }}
        />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="container mx-auto py-6 px-4 md:px-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {/* Command Palette */}
      <SearchCommand
        onTaskSelect={(taskId) => {
          // Could open task detail dialog here
          console.log("Selected task:", taskId)
        }}
        onListSelect={(listId) => {
          useUIStore.getState().setSelectedListId(listId)
        }}
        onLabelSelect={(labelId) => {
          useUIStore.getState().setSelectedLabelId(labelId)
        }}
      />
    </div>
  )
}
