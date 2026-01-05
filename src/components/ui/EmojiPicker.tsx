"use client"

import * as React from "react"
import { Smile, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Common emoji categories for quick selection
const RECENT_EMOJIS = [
  "📥", "📋", "📌", "📎", "✅", "⭐", "💡", "🎯",
  "🏠", "💼", "🛒", "📚", "💪", "🎨", "🎵", "🍽️",
]

const EMOJI_CATEGORIES = {
  objects: ["📁", "📂", "📄", "📊", "📈", "📉", "📋", "📌", "📎", "🔒", "🔓", "🔑", "💼", "📁", "📙", "📕"],
  symbols: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "✨"],
  activities: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🎱", "🏓", "🏸", "🥊", "🎮", "🎲", "🎨", "🎭", "🎪", "🎤"],
  travel: ["✈️", "🚗", "🚕", "🚌", "🚎", "🏎️", "🚲", "🛵", "🚂", "🚃", "🚄", "🚅", "🚆", "🚇", "🚈", "🛶"],
}

interface EmojiPickerProps {
  value?: string | null
  onChange: (emoji: string) => void
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [customEmoji, setCustomEmoji] = React.useState(value || "")

  const allEmojis = [
    ...RECENT_EMOJIS,
    ...EMOJI_CATEGORIES.objects,
    ...EMOJI_CATEGORIES.symbols,
    ...EMOJI_CATEGORIES.activities,
    ...EMOJI_CATEGORIES.travel,
  ]

  const handleSelectEmoji = (emoji: string) => {
    onChange(emoji)
    setCustomEmoji(emoji)
    setOpen(false)
  }

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setCustomEmoji(input)
    // Take the last emoji character if multiple are pasted
    const emojiMatch = input.match(/\p{Emoji}/u)
    if (emojiMatch) {
      const lastEmoji = input.slice(emojiMatch.index || 0).match(/\p{Emoji}/u)?.[0]
      if (lastEmoji) {
        onChange(lastEmoji)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && customEmoji) {
      onChange(customEmoji.slice(-1) || customEmoji)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          type="button"
        >
          <span className="text-lg">{value || "📁"}</span>
          <span className="text-sm">{value ? "Change emoji" : "Select emoji"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">Choose an emoji</div>

          {/* Custom emoji input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customEmoji}
              onChange={handleCustomInput}
              onKeyDown={handleKeyDown}
              className="flex-1 rounded-md border px-2 text-sm"
              placeholder="Type or paste emoji"
              maxLength={10}
            />
            {customEmoji && (
              <button
                type="button"
                onClick={() => setCustomEmoji("")}
                className="p-2 hover:bg-accent rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick selection */}
          <div className="grid grid-cols-8 gap-1">
            {allEmojis.slice(0, 24).map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelectEmoji(emoji)}
                className={cn(
                  "h-8 w-8 rounded-md text-lg transition-all hover:bg-accent",
                  value === emoji && "bg-accent ring-2 ring-primary"
                )}
                aria-label={`Select emoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* No emoji option */}
          <button
            type="button"
            onClick={() => {
              onChange("")
              setCustomEmoji("")
              setOpen(false)
            }}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md py-2 text-sm transition-all hover:bg-accent",
              !value && "bg-accent"
            )}
          >
            <Smile className="h-4 w-4" />
            <span>No emoji</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
