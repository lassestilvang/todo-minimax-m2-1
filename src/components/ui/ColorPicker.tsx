"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DEFAULT_COLORS } from "@/lib/constants"

interface ColorPickerProps {
  value?: string | null
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedColor = value || DEFAULT_COLORS[0]
  const isLightColor = (color: string) => {
    const hex = color.replace("#", "")
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 155
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          type="button"
        >
          <div
            className="h-5 w-5 rounded-full border"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-sm">
            {DEFAULT_COLORS.includes(selectedColor as typeof DEFAULT_COLORS[number])
              ? "Select color"
              : "Custom"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">Choose a color</div>
          <div className="grid grid-cols-4 gap-2">
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color)
                  setOpen(false)
                }}
                className={cn(
                  "h-8 w-8 rounded-md border-2 transition-all hover:scale-105",
                  selectedColor === color
                    ? "border-primary"
                    : "border-transparent"
                )}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              >
                {selectedColor === color && (
                  <Check
                    className={cn(
                      "mx-auto h-4 w-4",
                      isLightColor(color) ? "text-foreground" : "text-white"
                    )}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => onChange(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded-md border"
              />
              <input
                type="text"
                value={selectedColor}
                onChange={(e) => {
                  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    onChange(e.target.value)
                  }
                }}
                className="flex-1 rounded-md border px-2 text-sm"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
