"use server"

import { revalidatePath } from "next/cache"
import { updateList } from "@/lib/db/operations"
import type { UpdateListInput } from "@/lib/types"

export async function updateListAction(id: string, formData: FormData) {
  const name = formData.get("name") as string | null
  const color = formData.get("color") as string | null
  const emoji = formData.get("emoji") as string | null

  if (!id) {
    return { success: false, error: "List ID is required" }
  }

  try {
    const input: UpdateListInput = {}

    if (name !== null && name.trim() !== "") {
      input.name = name.trim()
    }

    if (color !== null) {
      input.color = color || null
    }

    if (emoji !== null) {
      input.emoji = emoji || null
    }

    const list = updateList(id, input)

    if (!list) {
      return { success: false, error: "List not found" }
    }

    revalidatePath("/")

    return { success: true, list }
  } catch (error) {
    console.error("Error updating list:", error)
    return { success: false, error: "Failed to update list" }
  }
}
