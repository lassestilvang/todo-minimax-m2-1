"use server"

import { revalidatePath } from "next/cache"
import { deleteList } from "@/lib/db/operations"

export async function deleteListAction(id: string) {
  if (!id) {
    return { success: false, error: "List ID is required" }
  }

  try {
    const success = deleteList(id)

    if (!success) {
      return { success: false, error: "List not found" }
    }

    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error deleting list:", error)
    return { success: false, error: "Failed to delete list" }
  }
}
