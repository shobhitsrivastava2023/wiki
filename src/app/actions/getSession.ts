import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function getUserId(){ 
    const session = await auth.api.getSession({headers : await headers()})
    const userId = session?.user.id
    return userId
   
}