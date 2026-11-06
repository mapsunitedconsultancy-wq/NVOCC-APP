import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/auth/check-email
 * Checks if an email exists in public.users table before registration or password reset.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .ilike('email', cleanEmail)
      .limit(1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const exists = Boolean(data && data.length > 0);

    return NextResponse.json({
      success: true,
      exists,
      email: cleanEmail,
      message: exists ? 'Email already registered' : 'Email available',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error checking email' },
      { status: 500 }
    );
  }
}

