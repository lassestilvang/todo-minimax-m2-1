"use client"

import * as React from "react"
import { Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useUIStore } from "@/store/ui-store"
import { ListSidebar } from "@/components/lists/ListSidebar"
import type { ListWithTaskCount } from "@/lib/types"

interface SidebarClientProps {
  initialLists: ListWithTaskCount[]
  overdueCount: number
}

export function SidebarClient({ initialLists, overdueCount }: SidebarClientProps) {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r bg-card h-[calc(100vh-3.5rem)] sticky top-14"
        )}
      >
        <ScrollArea className="flex-1">
          <ListSidebar initialLists={initialLists} overdueCount={overdueCount} />
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
            <ListSidebar 
              initialLists={initialLists} 
              overdueCount={overdueCount}
              onItemClick={() => setSidebarOpen(false)}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
