import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * PATCH /api/auth/profile
 * Authenticated endpoint: updates or inserts public.users profile fields
 * (firm_name, phone, gst_number, contact_person, plan)
 */
export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1]?.trim() : null;

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Missing or malformed Authorization header' },
      { status: 401 }
    );
  }

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);

  if (authErr || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid or expired token' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { firm_name, company_name, phone, gst_number, contact_person, plan } = body;
    const targetFirm = (firm_name || company_name || '').trim();

    const payload = {
      id: user.id,
      email: user.email!,
      firm_name: targetFirm || null,
      company_name: targetFirm || null,
      phone: phone?.trim() || null,
      gst_number: gst_number?.trim()?.toUpperCase() || null,
      contact_person: contact_person?.trim() || null,
      plan: plan || 'demo',
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('users')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Sync Supabase Auth metadata for seamless client session hydration
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        firm: {
          legalName: targetFirm,
          tradeName: targetFirm,
          gstin: gst_number,
          phone,
        },
        full_name: contact_person,
        phone,
        onboardingCompleted: Boolean(targetFirm && phone),
      },
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: 'Profile updated successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error updating profile' },
      { status: 500 }
    );
  }
}

