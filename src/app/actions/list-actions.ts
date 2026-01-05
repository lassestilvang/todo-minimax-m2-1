"use server"

import { revalidatePath } from "next/cache"
import { createList } from "@/lib/db/operations"
import type { CreateListInput } from "@/lib/types"

export async function createListAction(formData: FormData) {
  const name = formData.get("name") as string
  const color = formData.get("color") as string | null
  const emoji = formData.get("emoji") as string | null

  if (!name || name.trim() === "") {
    return { success: false, error: "List name is required" }
  }

  try {
    const input: CreateListInput = {
      name: name.trim(),
      color: color || null,
      emoji: emoji || null,
    }

    const list = createList(input)
    
    revalidatePath("/")
    
    return { success: true, list }
  } catch (error) {
    console.error("Error creating list:", error)
    return { success: false, error: "Failed to create list" }
  }
}
