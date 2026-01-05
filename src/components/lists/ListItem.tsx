"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2, List as ListIcon } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUIStore } from "@/store/ui-store"
import { EditListDialog } from "./EditListDialog"
import { deleteListAction } from "@/app/actions/delete-list-action"
import type { ListWithTaskCount } from "@/lib/types"

interface ListItemProps {
  list: ListWithTaskCount
}

export function ListItem({ list }: ListItemProps) {
  const router = useRouter()
  const { selectedListId, setSelectedListId } = useUIStore()
  const [isHovered, setIsHovered] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const isActive = selectedListId === list.id
  const incompleteCount = list.task_count - list.completed_count

  const handleClick = () => {
    setSelectedListId(list.id)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteListAction(list.id)
      router.refresh()
    } catch (error) {
      console.error("Failed to delete list:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className="relative"
      >
        <div
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
            isActive
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
          )}
          style={{
            borderLeft: list.color ? `3px solid ${list.color}` : undefined,
          }}
        >
          {/* Color indicator dot */}
          {list.color && (
            <div
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: list.color }}
            />
          )}

          {/* Emoji or default icon */}
          <span className="text-base shrink-0">
            {list.emoji || <ListIcon className="h-4 w-4" />}
          </span>

          {/* List name */}
          <span className="flex-1 truncate">{list.name}</span>

          {/* Task count badge */}
          {list.task_count > 0 && (
            <Badge
              variant={isActive ? "secondary" : "outline"}
              className={cn(
                "h-5 min-w-[20px] justify-center text-xs",
                isActive ? "bg-primary/20" : ""
              )}
            >
              {incompleteCount > 99 ? "99+" : incompleteCount}
            </Badge>
          )}

          {/* Hover actions */}
          <div
            className={cn(
              "flex items-center gap-1 transition-opacity",
              isHovered || isActive ? "opacity-100" : "opacity-0"
            )}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <EditListDialog list={list}>
                    <div className="flex items-center gap-2 cursor-pointer">
                      <Pencil className="h-4 w-4" />
                      Edit list
                    </div>
                  </EditListDialog>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete list
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tooltip for full name on hover */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute inset-0 -z-10" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{list.name}</p>
            <p className="text-xs text-muted-foreground">
              {list.task_count} tasks, {list.completed_count} completed
            </p>
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </TooltipProvider>
  )
}
