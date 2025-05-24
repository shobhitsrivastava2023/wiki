import { NextRequest, NextResponse } from 'next/server'
import { createNotebook, updateNotebook } from '@/app/actions/saveNotebook'

export async function POST(request: NextRequest) {
  try {
    const { userId, name, content, notebookId } = await request.json()
    
    
      // Create new notebook
     const result = await createNotebook(userId, name, content)
     if (result.success){ 
          return NextResponse.json(result)
     }
    }
    
  
   catch (error) {
    console.error('Failed to save notebook:', error)
    return NextResponse.json({ error: 'Failed to save notebook' }, { status: 500 })
  }
}