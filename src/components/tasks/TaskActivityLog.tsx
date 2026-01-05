"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { format, formatDistanceToNow } from "date-fns"
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Tag,
  Calendar,
  Bell,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { TaskLog } from "@/lib/types"

interface TaskActivityLogProps {
  logs: TaskLog[]
  maxHeight?: number
}

const ACTION_CONFIG = {
  created: {
    icon: Plus,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    label: "Created",
  },
  updated: {
    icon: Pencil,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    label: "Updated",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    label: "Completed",
  },
  uncompleted: {
    icon: Circle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    label: "Reopened",
  },
  deleted: {
    icon: Trash2,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Deleted",
  },
} as const

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  description: "Description",
  date: "Date",
  deadline: "Deadline",
  priority: "Priority",
  list_id: "List",
  estimate_minutes: "Estimated time",
  actual_minutes: "Actual time",
  recurring_pattern: "Recurring pattern",
  labels: "Labels",
  subtasks: "Subtasks",
  reminder: "Reminder",
  attachments: "Attachments",
}

export function TaskActivityLog({ logs, maxHeight = 300 }: TaskActivityLogProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity yet</p>
      </div>
    )
  }

  return (
    <ScrollArea className="rounded-md border" style={{ maxHeight }}>
      <div className="p-4 space-y-4">
        {logs.map((log, index) => {
          const config = ACTION_CONFIG[log.action]
          const Icon = config?.icon || Clock
          const isFirst = index === 0

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex gap-3 relative",
                index < logs.length - 1 && "pb-4"
              )}
            >
              {/* Timeline Line */}
              {index < logs.length - 1 && (
                <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
              )}

              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex items-center justify-center w-6 h-6 rounded-full shrink-0",
                  config?.bgColor || "bg-muted"
                )}
              >
                <Icon className={cn("h-3 w-3", config?.color || "text-muted-foreground")} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-sm font-medium", config?.color || "")}>
                    {config?.label || log.action}
                  </span>
                  {isFirst && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      New
                    </span>
                  )}
                </div>

                {/* Field Change */}
                {log.field_changed && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">
                      {FIELD_LABELS[log.field_changed] || log.field_changed}
                    </span>
                    {log.old_value !== undefined && log.old_value !== null ? (
                      <span className="mx-2">
                        <span className="line-through opacity-50">{log.old_value}</span>
                        <span className="mx-1">→</span>
                        <span className="font-medium">{log.new_value}</span>
                      </span>
                    ) : (
                      log.new_value && (
                        <span className="ml-1 font-medium">{log.new_value}</span>
                      )
                    )}
                  </div>
                )}

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  {" · "}
                  {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>

                {/* User */}
                {log.created_by && log.created_by !== "user" && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by {log.created_by}
                  </p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

// Compact version for inline display
export function CompactActivityLog({ logs, limit = 3 }: { logs: TaskLog[]; limit?: number }) {
  const recentLogs = logs.slice(0, limit)
  
  if (recentLogs.length === 0) return null

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      <span>
        {recentLogs[0].action === "created"
          ? "Created"
          : recentLogs[0].action === "completed"
          ? "Completed"
          : "Updated"}{" "}
        {formatDistanceToNow(new Date(recentLogs[0].created_at), { addSuffix: true })}
      </span>
    </div>
  )
}
