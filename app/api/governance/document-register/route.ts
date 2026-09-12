import { NextRequest, NextResponse } from 'next/server';
import {
  getMasterDocumentRegister,
  getMasterDocumentSummary,
  MASTER_DOCUMENT_REGISTER,
} from '@/lib/services/masterDocumentRegister';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const documentClass = searchParams.get('documentClass') || undefined;
    const audience = searchParams.get('audience') || undefined;
    const search = searchParams.get('search') || undefined;

    const items = getMasterDocumentRegister({
      category,
      status,
      documentClass,
      audience,
      search,
    });

    const summary = getMasterDocumentSummary();

    return NextResponse.json({
      ok: true,
      summary,
      filters: { category, status, documentClass, audience, search },
      count: items.length,
      items,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
