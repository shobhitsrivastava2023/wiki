import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";// your drizzle instance
import { account, session, user, verification } from "@/db/schema";
 
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", 
        schema:{ 
            user: user,
            session: session,
            account : account, 
            verification: verification

        }      
    },),
    emailAndPassword: {  
        enabled: true
    },
});