"use server"

import { auth } from "@/lib/auth"


export const signIn = async (email : string, password : string) => { 
    await auth.api.signInEmail({ 
       body: { 
              email: email, 
              password: password 
       }
    })
}


export const signUp = async (email : string, password : string, username : string ) => { 
    await auth.api.signUpEmail({ 
       body: { 
              email: email, 
              password: password, 
              name: username,
       }
    })
}