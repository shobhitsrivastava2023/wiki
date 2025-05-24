import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";// your drizzle instance
import { account, notebook, session, user, verification } from "@/db/schema";
import { nextCookies } from "better-auth/next-js";
 
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", 
        schema:{ 
            user: user,
            session: session,
            account : account, 
            verification: verification,
            Notebook : notebook

        }      
    },),
    emailAndPassword: {  
        enabled: true
    },
    plugins : [
        nextCookies()
    ]
});