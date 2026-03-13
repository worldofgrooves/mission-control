import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { password } = await request.json()

    if (!password || password !== process.env.SITE_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const sessionSecret = process.env.SESSION_SECRET
    if (!sessionSecret) {
      console.error('SESSION_SECRET env var not set')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set('mc_session', sessionSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
