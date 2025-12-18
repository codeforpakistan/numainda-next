import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    if (password === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ status: 'authorized' });
    }
    
    return new NextResponse('Unauthorized', { status: 401 });
  } catch (error) {
    return new NextResponse('Error', { status: 500 });
  }
} 