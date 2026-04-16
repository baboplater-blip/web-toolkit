import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/chat/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    '/harnesses/:path*',
    '/login',
    '/signup',
  ],
};
