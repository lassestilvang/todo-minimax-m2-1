import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { ViewMode } from "@/lib/types"

interface UIState {
  // View state
  currentView: ViewMode
  setCurrentView: (view: ViewMode) => void

  // Sidebar state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Task visibility
  showCompletedTasks: boolean
  setShowCompletedTasks: (show: boolean) => void
  toggleShowCompletedTasks: () => void

  // Selection state
  selectedListId: string | null
  setSelectedListId: (id: string | null) => void

  selectedLabelId: string | null
  setSelectedLabelId: (id: string | null) => void

  // Search state
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void

  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  // Add task dialog
  addTaskOpen: boolean
  setAddTaskOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // View state
      currentView: "today",
      setCurrentView: (view) => set({ currentView: view }),

      // Sidebar state
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Task visibility
      showCompletedTasks: false,
      setShowCompletedTasks: (show) => set({ showCompletedTasks: show }),
      toggleShowCompletedTasks: () =>
        set((state) => ({ showCompletedTasks: !state.showCompletedTasks })),

      // Selection state
      selectedListId: null,
      setSelectedListId: (id) => set({ selectedListId: id }),

      selectedLabelId: null,
      setSelectedLabelId: (id) => set({ selectedLabelId: id }),

      // Search state
      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),

      // Command palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // Add task dialog
      addTaskOpen: false,
      setAddTaskOpen: (open) => set({ addTaskOpen: open }),
    }),
    {
      name: "todo-app-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentView: state.currentView,
        sidebarOpen: state.sidebarOpen,
        showCompletedTasks: state.showCompletedTasks,
        selectedListId: state.selectedListId,
      }),
    }
  )
)
