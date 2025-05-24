"use server"

import { db } from "@/db"
import { notebook } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"

export async function createNotebook(userId: string, title: string, description?: string) {
  try {
    const id = uuidv4()

    await db.insert(notebook).values({
      id,
      title,
      description: description || "",
      content: "",
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    revalidatePath("/notebooks")
    return { success: true, id }
  } catch (error) {
    console.error("Failed to create notebook:", error)
    return { success: false, error: "Failed to create notebook" }
  }
}

export async function updateNotebook(notebookId: string, updateData: { title?: string, description?: string, content?: string }) {
  try {
    const existingNotebook = await db.query.notebook.findFirst({ where: eq(notebook.id, notebookId) });

    if (!existingNotebook) {
      return { success: false, error: "Notebook not found" };
    }

    // Construct the update payload, ensuring no undefined values are passed to Drizzle.
    // Drizzle requires values to be their type or null if nullable, but not undefined.
    const payload: {
      title?: string;
      description?: string | null;
      content?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    // Handle title: Must be a string as per schema (notNull)
    // If updateData.title is undefined, use existing. If existing is also undefined (unexpected for notNull), default to empty string.
    payload.title = updateData.title ?? existingNotebook.title ?? "";

    // Handle description: Can be string or null as per schema
    // If updateData.description is undefined, use existing. If existing is undefined, default to null.
    payload.description = updateData.description !== undefined ? updateData.description : existingNotebook.description ?? null;


    // Handle content: Can be string or null as per schema
    // If updateData.content is undefined, use existing. If existing is undefined, default to null.
    payload.content = updateData.content !== undefined ? updateData.content : existingNotebook.content ?? null;


    // Filter out any properties that are explicitly undefined if Drizzle is strict about them
    const finalUpdatePayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    );


    await db.update(notebook).set(finalUpdatePayload).where(eq(notebook.id, notebookId))

    revalidatePath(`/notebooks/${notebookId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update notebook:", error)
    // Return a more specific error if possible
    if (error instanceof Error) {
        return { success: false, error: `Failed to update notebook: ${error.message}` };
    }
    return { success: false, error: "Failed to update notebook: An unknown error occurred" }
  }
}

export async function updateNotebookContent(notebookId: string, content: string) {
  try {
    await db
      .update(notebook)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(notebook.id, notebookId))

    revalidatePath(`/notebooks/${notebookId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update notebook content:", error)
    return { success: false, error: "Failed to update notebook content" }
  }
}


export async function deleteNotebook(notebookId: string) {
  try {
    await db.delete(notebook).where(eq(notebook.id, notebookId))

    revalidatePath("/notebooks")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete notebook:", error)
    return { success: false, error: "Failed to delete notebook" }
  }
}

export async function getNotebook(notebookId: string) {
  try {
    const result = await db.query.notebook.findFirst({
      where: eq(notebook.id, notebookId),
    })

    return { success: true, notebook: result }
  } catch (error) {
    console.error("Failed to get notebook:", error)
    return { success: false, error: "Failed to get notebook" }
  }
}

export async function getUserNotebooks(userId: string) {
  try {
    const notebooks = await db.query.notebook.findMany({
      where: eq(notebook.userId, userId),
    })

    return { success: true, notebooks }
  } catch (error) {
    console.error("Failed to get user notebooks:", error)
    return { success: false, error: "Failed to get user notebooks" }
  }
}