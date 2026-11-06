import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/auth/me
 * Authenticated endpoint: returns public.users profile of the verified user.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1]?.trim() : null;

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Missing or malformed Authorization header' },
      { status: 401 }
    );
  }

  try {
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);

    if (authErr || !user) {
      return NextResponse.json(
        { success: false, error: authErr?.message || 'Unauthorized: Token is invalid or expired' },
        { status: 401 }
      );
    }

    const { data: profile, error: dbErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (dbErr) {
      return NextResponse.json(
        { success: false, error: dbErr.message },
        { status: 500 }
      );
    }

    const isProfileComplete = Boolean(profile?.firm_name && profile?.phone);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        ...(profile || {}),
        isProfileComplete,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error retrieving profile' },
      { status: 500 }
    );
  }
}

