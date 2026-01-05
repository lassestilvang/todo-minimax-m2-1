"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  ChevronRight,
  Clock,
  Inbox,
  LayoutGrid,
  List,
  Plus,
  Tag,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useUIStore } from "@/store/ui-store"
import { Badge } from "@/components/ui/badge"
import type { ListWithTaskCount } from "@/lib/types"

interface SidebarProps {
  className?: string
  lists?: ListWithTaskCount[]
  overdueCount?: number
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  badge?: number
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  active?: boolean
  onClick?: () => void
}

function NavItem({ icon, label, badge, badgeVariant = "secondary", active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
      )}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge 
          variant={badgeVariant} 
          className={cn(
            "h-5 min-w-[20px] justify-center text-xs",
            badgeVariant === "destructive" && "animate-pulse"
          )}
        >
          {badge > 99 ? "99+" : badge}
        </Badge>
      )}
    </button>
  )
}

interface SidebarContentProps {
  onItemClick?: () => void
  lists?: ListWithTaskCount[]
  overdueCount?: number
}

function SidebarContent({ onItemClick, lists = [], overdueCount = 0 }: SidebarContentProps) {
  const {
    currentView,
    setCurrentView,
    showCompletedTasks,
    toggleShowCompletedTasks,
    sidebarOpen,
    setSidebarOpen,
  } = useUIStore()

  const [listsOpen, setListsOpen] = React.useState(true)
  const [labelsOpen, setLabelsOpen] = React.useState(false)

  // Default lists if none provided
  const displayLists = lists.length > 0 ? lists : [
    { id: "1", name: "Inbox", task_count: 12, completed_count: 3, color: null, emoji: null, is_default: true, created_at: new Date(), updated_at: new Date() },
    { id: "2", name: "Personal", task_count: 5, completed_count: 1, color: null, emoji: null, is_default: false, created_at: new Date(), updated_at: new Date() },
    { id: "3", name: "Work", task_count: 8, completed_count: 2, color: null, emoji: null, is_default: false, created_at: new Date(), updated_at: new Date() },
  ]

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Main navigation */}
      <nav className="flex flex-col gap-1 px-2">
        <NavItem
          icon={<Inbox className="h-4 w-4" />}
          label="Inbox"
          badge={overdueCount > 0 ? overdueCount : undefined}
          badgeVariant={overdueCount > 0 ? "destructive" : "secondary"}
          active={currentView === "today"}
          onClick={() => {
            setCurrentView("today")
            onItemClick?.()
          }}
        />
        <NavItem
          icon={<Clock className="h-4 w-4" />}
          label="Next 7 days"
          active={currentView === "week"}
          onClick={() => {
            setCurrentView("week")
            onItemClick?.()
          }}
        />
        <NavItem
          icon={<Calendar className="h-4 w-4" />}
          label="Upcoming"
          active={currentView === "upcoming"}
          onClick={() => {
            setCurrentView("upcoming")
            onItemClick?.()
          }}
        />
        <NavItem
          icon={<LayoutGrid className="h-4 w-4" />}
          label="All tasks"
          active={currentView === "all"}
          onClick={() => {
            setCurrentView("all")
            onItemClick?.()
          }}
        />
        {/* Overdue section - shown when there are overdue tasks */}
        {overdueCount > 0 && (
          <div className="mt-2 pt-2 border-t border-border">
            <button
              onClick={() => {
                setCurrentView("today")
                onItemClick?.()
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-destructive",
                "hover:bg-destructive/10"
              )}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="flex-1 text-left">Overdue</span>
              <Badge variant="destructive" className="h-5 min-w-[20px] justify-center text-xs animate-pulse">
                {overdueCount > 99 ? "99+" : overdueCount}
              </Badge>
            </button>
          </div>
        )}
      </nav>

      {/* My Lists */}
      <Collapsible open={listsOpen} onOpenChange={setListsOpen}>
        <div className="flex items-center px-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 flex-1 justify-start px-2">
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform",
                  listsOpen && "rotate-90"
                )}
              />
              <span className="ml-1 text-sm font-medium">My Lists</span>
            </Button>
          </CollapsibleTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {}}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <CollapsibleContent>
          <nav className="flex flex-col gap-1 px-2 py-1">
            {displayLists.map((list) => (
              <NavItem
                key={list.id}
                icon={<List className="h-4 w-4" />}
                label={list.name}
                badge={list.task_count - list.completed_count}
                active={currentView === "list" && list.id === "1"}
                onClick={() => {
                  setCurrentView("list")
                  onItemClick?.()
                }}
              />
            ))}
          </nav>
        </CollapsibleContent>
      </Collapsible>

      {/* Labels */}
      <Collapsible open={labelsOpen} onOpenChange={setLabelsOpen}>
        <div className="flex items-center px-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 flex-1 justify-start px-2">
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform",
                  labelsOpen && "rotate-90"
                )}
              />
              <span className="ml-1 text-sm font-medium">Labels</span>
            </Button>
          </CollapsibleTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {}}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <CollapsibleContent>
          <nav className="flex flex-col gap-1 px-2 py-1">
            <NavItem
              icon={<Tag className="h-4 w-4" />}
              label="Urgent"
              active={false}
              onClick={() => {}}
            />
            <NavItem
              icon={<Tag className="h-4 w-4" />}
              label="Personal"
              active={false}
              onClick={() => {}}
            />
            <NavItem
              icon={<Tag className="h-4 w-4" />}
              label="Work"
              active={false}
              onClick={() => {}}
            />
          </nav>
        </CollapsibleContent>
      </Collapsible>

      {/* Show completed toggle */}
      <div className="px-2">
        <button
          onClick={toggleShowCompletedTasks}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            showCompletedTasks
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
          )}
        >
          <div
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded border",
              showCompletedTasks
                ? "bg-primary border-primary"
                : "border-muted-foreground"
            )}
          >
            {showCompletedTasks && (
              <svg
                className="h-3 w-3 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          Show completed
        </button>
      </div>
    </div>
  )
}

export function Sidebar({ className, lists = [], overdueCount = 0 }: SidebarProps) {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r bg-card h-[calc(100vh-3.5rem)] sticky top-14",
          className
        )}
      >
        <ScrollArea className="flex-1">
          <SidebarContent lists={lists} overdueCount={overdueCount} />
        </ScrollArea>
      </aside>

      {/* Mobile sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Todo App
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-5rem)]">
            <SidebarContent 
              onItemClick={() => setSidebarOpen(false)} 
              lists={lists} 
              overdueCount={overdueCount}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
