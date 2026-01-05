"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Calendar, Clock, Sparkles, Layers, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/store/ui-store"

interface ViewToggleProps {
  className?: string
}

const VIEW_OPTIONS = [
  { value: "today", label: "Today", icon: Inbox, shortcut: "1" },
  { value: "week", label: "7 Days", icon: Clock, shortcut: "2" },
  { value: "upcoming", label: "Upcoming", icon: Sparkles, shortcut: "3" },
  { value: "all", label: "All", icon: Layers, shortcut: "4" },
] as const

export function ViewToggle({ className }: ViewToggleProps) {
  const { currentView, setCurrentView } = useUIStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    
    // Handle keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      // View shortcuts (with Cmd/Ctrl)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const option = VIEW_OPTIONS.find((opt) => opt.shortcut === e.key)
        if (option) {
          e.preventDefault()
          setCurrentView(option.value)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setCurrentView])

  if (!mounted) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-lg bg-muted p-1",
          className
        )}
      >
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              "text-muted-foreground"
            )}
          >
            <option.icon className="h-4 w-4" />
            {option.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-muted p-1",
        className
      )}
    >
      {VIEW_OPTIONS.map((option) => {
        const Icon = option.icon
        const isActive = currentView === option.value
        
        return (
          <motion.button
            key={option.value}
            onClick={() => setCurrentView(option.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all relative",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{option.label}</span>
            
            {/* Keyboard shortcut indicator */}
            <kbd className={cn(
              "pointer-events-none absolute -top-1 -right-1 hidden h-4 select-none items-center rounded bg-muted px-1 font-mono text-[9px] font-medium opacity-100 sm:flex",
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}>
              ⌘{option.shortcut}
            </kbd>
            
            {/* Active indicator line */}
            {isActive && (
              <motion.div
                layoutId="activeView"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

// Compact version for mobile
export function ViewToggleCompact({ className }: ViewToggleProps) {
  const { currentView, setCurrentView } = useUIStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-10 w-40 bg-muted animate-pulse rounded-lg" />
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-muted p-1",
        className
      )}
    >
      {VIEW_OPTIONS.map((option) => {
        const Icon = option.icon
        const isActive = currentView === option.value
        
        return (
          <button
            key={option.value}
            onClick={() => setCurrentView(option.value)}
            className={cn(
              "inline-flex items-center justify-center rounded-md p-2 transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
