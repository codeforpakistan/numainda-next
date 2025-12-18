import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader) {
    return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_PEHCHAN_URL}/api/auth/userinfo`, {
      headers: {
        'Authorization': authHeader
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user info')
    }

    const data = await response.json()
    console.log('Pehchan userinfo response:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('User info error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user info' }, 
      { status: 500 }
    )
  }
} 