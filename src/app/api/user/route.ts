import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/app/actions/getSession'

export async function GET() {
  try {
    const userId = await getUserId()
    return NextResponse.json({ userId })
  } catch (error) {
    console.error('Failed to get user ID:', error)
    return NextResponse.json({ error: 'Failed to get user ID' }, { status: 500 })
  }
}