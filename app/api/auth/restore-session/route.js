import { NextResponse } from 'next/server'

// Restores a session cookie from a locally-stored token.
// Used by macOS/iOS web apps where cookies don't persist between launches
// but localStorage does. On login, the token is saved to localStorage.
// On next launch, the login page calls this endpoint to silently re-authenticate.
export async function POST(request) {
  try {
    const { token } = await request.json()
    const sessionSecret = (process.env.SESSION_SECRET || '').trim()

    if (!token || !sessionSecret || token.trim() !== sessionSecret) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set('mc_session', sessionSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })

    return response
  } catch (err) {
    console.error('restore-session error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
