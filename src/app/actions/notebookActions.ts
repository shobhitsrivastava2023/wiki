"use server"; // This directive marks the file (or specific functions) as server-only

import { auth } from '@/lib/auth'; // Path to your server-side better-auth instance
import { headers } from 'next/headers'; // To access request headers for session

// Import your existing Drizzle functions
import {
  createNotebook,
  updateNotebook,
  updateNotebookContent,
  deleteNotebook,
  getNotebook,
  getUserNotebooks
} from './saveNotebook'; // Adjust this path if your Drizzle functions are elsewhere

// Define a common return type for actions for consistency
interface ActionResponse<T = undefined> {
  success: boolean;
  error?: string;
  data?: T; // For actions that return data (e.g., created ID, fetched notebook)
}

/**
 * Server Action to create a new notebook securely.
 * It retrieves the userId from the session on the server.
 */
export async function createNotebookAction(
  title: string,
  description?: string
): Promise<ActionResponse<{ id: string }>> { // Specify data type for success
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!session || !userId) {
    console.log("Authentication required: No session or userId found for createNotebookAction.");
    return { success: false, error: "Authentication required to create a notebook." };
  }

  if (!title || title.trim() === "") {
    return { success: false, error: "Notebook title cannot be empty." };
  }

  try {
    // Call your existing server-side createNotebook function
    const result = await createNotebook(userId, title, description);

    if (result.success) {
      console.log(`Notebook "${title}" created successfully for user ${userId}. ID: ${result.id}`);
      return { success: true, data: { id: result.id! } }; // Ensure 'id' is present if success
    } else {
      // Use the error message from your createNotebook function
      console.error("Failed to create notebook:", result.error);
      return { success: false, error: result.error || "Failed to create notebook due to an unknown error." };
    }
  } catch (error: any) {
    console.error("Error in createNotebookAction:", error);
    return { success: false, error: `An unexpected error occurred: ${error.message || 'Unknown error'}` };
  }
}

/**
 * Server Action to update an existing notebook securely.
 * It retrieves the userId from the session on the server and ensures ownership.
 */
export async function updateNotebookAction(
  notebookId: string,
  updateData: { title?: string, description?: string, content?: string }
): Promise<ActionResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!session || !userId) {
    console.log("Authentication required: No session or userId found for updateNotebookAction.");
    return { success: false, error: "Authentication required to update a notebook." };
  }

  if (!notebookId) {
    return { success: false, error: "Notebook ID is required for update." };
  }

  // Optional: Add ownership check here.
  // This is a good security practice to ensure a user can only update their own notebooks.
  try {
    const notebookToUpdate = await getNotebook(notebookId);
    if (!notebookToUpdate.success || !notebookToUpdate.notebook) {
      return { success: false, error: "Notebook not found." };
    }
    if (notebookToUpdate.notebook.userId !== userId) {
      console.warn(`Unauthorized attempt to update notebook ${notebookId} by user ${userId}.`);
      return { success: false, error: "You are not authorized to update this notebook." };
    }

    // Call your existing server-side updateNotebook function
    const result = await updateNotebook(notebookId, updateData);

    if (result.success) {
      console.log(`Notebook ${notebookId} updated successfully.`);
      return { success: true };
    } else {
      console.error("Failed to update notebook:", result.error);
      return { success: false, error: result.error || "Failed to update notebook due to an unknown error." };
    }
  } catch (error: any) {
    console.error("Error in updateNotebookAction:", error);
    return { success: false, error: `An unexpected error occurred: ${error.message || 'Unknown error'}` };
  }
}

/**
 * Server Action to update only the content of a notebook securely.
 * It retrieves the userId from the session on the server and ensures ownership.
 */
export async function updateNotebookContentAction(
  notebookId: string,
  content: string
): Promise<ActionResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!session || !userId) {
    console.log("Authentication required: No session or userId found for updateNotebookContentAction.");
    return { success: false, error: "Authentication required to update notebook content." };
  }

  if (!notebookId) {
    return { success: false, error: "Notebook ID is required for content update." };
  }
  if (content === undefined || content === null) { // Allow empty string, but not undefined/null
    return { success: false, error: "Content cannot be undefined or null." };
  }

  // Optional: Add ownership check here.
  try {
    const notebookToUpdate = await getNotebook(notebookId);
    if (!notebookToUpdate.success || !notebookToUpdate.notebook) {
      return { success: false, error: "Notebook not found." };
    }
    if (notebookToUpdate.notebook.userId !== userId) {
      console.warn(`Unauthorized attempt to update content of notebook ${notebookId} by user ${userId}.`);
      return { success: false, error: "You are not authorized to update this notebook's content." };
    }

    const result = await updateNotebookContent(notebookId, content);

    if (result.success) {
      console.log(`Notebook ${notebookId} content updated successfully.`);
      return { success: true };
    } else {
      console.error("Failed to update notebook content:", result.error);
      return { success: false, error: result.error || "Failed to update notebook content due to an unknown error." };
    }
  } catch (error: any) {
    console.error("Error in updateNotebookContentAction:", error);
    return { success: false, error: `An unexpected error occurred: ${error.message || 'Unknown error'}` };
  }
}

// You can create similar Server Actions for deleteNotebook, getNotebook, and getUserNotebooks
// if you want to call them directly from client components or ensure server-side auth checks.

// Example: Get user notebooks with server-side session check
export async function getUserNotebooksAction(): Promise<ActionResponse<any[]>> { // Adjust 'any[]' to your actual notebook type
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!session || !userId) {
    return { success: false, error: "Authentication required to view notebooks." };
  }

  try {
    const result = await getUserNotebooks(userId);
    if (result.success) {
      return { success: true, data: result.notebooks };
    } else {
      return { success: false, error: result.error || "Failed to fetch notebooks." };
    }
  } catch (error: any) {
    console.error("Error fetching user notebooks:", error);
    return { success: false, error: `An unexpected error occurred: ${error.message || 'Unknown error'}` };
  }
}

// Example: Get a single notebook with server-side session and ownership check
export async function getNotebookAction(notebookId: string): Promise<ActionResponse<any>> { // Adjust 'any' to your actual notebook type
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!session || !userId) {
    return { success: false, error: "Authentication required to view notebook." };
  }

  if (!notebookId) {
    return { success: false, error: "Notebook ID is required." };
  }

  try {
    const result = await getNotebook(notebookId);
    if (!result.success || !result.notebook) {
      return { success: false, error: result.error || "Notebook not found." };
    }
    // Ownership check
    if (result.notebook.userId !== userId) {
      console.warn(`Unauthorized attempt to access notebook ${notebookId} by user ${userId}.`);
      return { success: false, error: "You are not authorized to view this notebook." };
    }
    return { success: true, data: result.notebook };
  } catch (error: any) {
    console.error("Error fetching notebook:", error);
    return { success: false, error: `An unexpected error occurred: ${error.message || 'Unknown error'}` };
  }
}