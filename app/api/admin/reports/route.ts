import { NextRequest, NextResponse } from 'next/server';
import { authErrorResponse, requireAuth } from '@/lib/auth/guard';
import { PERMISSIONS } from '@/lib/auth/rbac';
import { buildStoreReport } from '@/lib/services/report-service';

function fail(message: string, code: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status });
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [PERMISSIONS.REPORT_VIEW]);
  if (!auth.ok) return authErrorResponse(auth);

  try {
    const report = await buildStoreReport(auth.session.storeId);
    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    return fail('Failed to build report', 'INTERNAL_ERROR', 500, { message: (error as Error).message });
  }
}
