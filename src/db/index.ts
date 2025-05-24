// Create or update this file to properly initialize the database with the complete schema

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Use environment variables for the connection string
const connectionString = process.env.DATABASE_URL || ""

// Create the connection
const client = postgres(connectionString)

// Initialize Drizzle with the complete schema
export const db = drizzle(client, { schema })
