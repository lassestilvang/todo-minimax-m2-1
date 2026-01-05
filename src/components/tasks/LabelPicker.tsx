"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tag, Plus, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import type { Label } from "@/lib/types"

interface LabelPickerProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  labels: Label[]
  onCreateLabel?: (name: string, color?: string) => void
  className?: string
}

const DEFAULT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
]

export function LabelPicker({
  selectedIds,
  onChange,
  labels,
  onCreateLabel,
  className,
}: LabelPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [newLabelName, setNewLabelName] = React.useState("")
  const [selectedColor, setSelectedColor] = React.useState(DEFAULT_COLORS[0])
  const [showCreateForm, setShowCreateForm] = React.useState(false)

  const selectedLabels = labels.filter((l) => selectedIds.includes(l.id))

  const toggleLabel = (labelId: string) => {
    onChange(
      selectedIds.includes(labelId)
        ? selectedIds.filter((id) => id !== labelId)
        : [...selectedIds, labelId]
    )
  }

  const handleCreateLabel = () => {
    if (!newLabelName.trim()) return
    
    onCreateLabel?.(newLabelName.trim(), selectedColor)
    setNewLabelName("")
    setSelectedColor(DEFAULT_COLORS[0])
    setShowCreateForm(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("flex items-center gap-2", className)}
        >
          <Tag className="h-4 w-4" />
          {selectedLabels.length > 0 ? (
            <div className="flex items-center gap-1">
              {selectedLabels.slice(0, 2).map((label) => (
                <Badge
                  key={label.id}
                  variant="secondary"
                  className="text-xs px-1.5 py-0"
                  style={
                    label.color
                      ? { backgroundColor: label.color + "20", color: label.color }
                      : {}
                  }
                >
                  {label.name}
                </Badge>
              ))}
              {selectedLabels.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{selectedLabels.length - 2}
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">Add labels</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search labels..."
            value={newLabelName}
            onValueChange={(v) => {
              setNewLabelName(v)
              setShowCreateForm(Boolean(v && !labels.some((l) => l.name.toLowerCase() === v.toLowerCase())))
            }}
          />
          <CommandList>
            <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
              No labels found
            </CommandEmpty>

            <CommandGroup heading="Available Labels">
              {labels.map((label) => (
                <CommandItem
                  key={label.id}
                  onSelect={() => toggleLabel(label.id)}
                  className="flex items-center gap-2"
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center border",
                      selectedIds.includes(label.id)
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {selectedIds.includes(label.id) && <Check className="h-3 w-3" />}
                  </div>
                  {label.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                  )}
                  <span>{label.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <AnimatePresence>
              {showCreateForm && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-2 py-2 space-y-2"
                    >
                      <div className="text-xs font-medium text-muted-foreground">
                        Create new label
                      </div>
                      <Input
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        placeholder="Label name"
                        className="h-8"
                      />
                      <div className="flex items-center gap-2">
                        {DEFAULT_COLORS.slice(0, 8).map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={cn(
                              "w-6 h-6 rounded-full border-2 transition-transform",
                              selectedColor === color
                                ? "border-foreground scale-110"
                                : "border-transparent"
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => setSelectedColor(color)}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={handleCreateLabel}
                        >
                          Create
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowCreateForm(false)
                            setNewLabelName("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  </CommandGroup>
                </>
              )}
            </AnimatePresence>
          </CommandList>
        </Command>

        {selectedLabels.length > 0 && (
          <div className="p-2 border-t flex flex-wrap gap-1">
            {selectedLabels.map((label) => (
              <Badge
                key={label.id}
                variant="secondary"
                className="text-xs cursor-pointer"
                style={
                  label.color
                    ? { backgroundColor: label.color + "20", color: label.color }
                    : {}
                }
                onClick={() => toggleLabel(label.id)}
              >
                {label.name}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Compact inline version
export function LabelBadges({
  labels,
  selectedIds,
  onToggle,
  maxDisplay = 3,
}: {
  labels: Label[]
  selectedIds: string[]
  onToggle: (id: string) => void
  maxDisplay?: number
}) {
  const displayed = labels.filter((l) => selectedIds.includes(l.id)).slice(0, maxDisplay)
  const remaining = selectedIds.length - maxDisplay

  if (displayed.length === 0 && remaining <= 0) return null

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {displayed.map((label) => (
        <Badge
          key={label.id}
          variant="secondary"
          className="text-xs cursor-pointer hover:opacity-80"
          style={
            label.color
              ? { backgroundColor: label.color + "20", color: label.color }
              : {}
          }
          onClick={() => onToggle(label.id)}
        >
          {label.name}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remaining}
        </Badge>
      )}
    </div>
  )
}
