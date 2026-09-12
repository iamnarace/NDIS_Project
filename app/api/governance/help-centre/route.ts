import { NextResponse } from 'next/server';
import { getOperationsGuideWorkflows, getOperationsGuideWorkflow } from '@/lib/services/operationsGuide';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const category = searchParams.get('category');

  if (id) {
    const item = getOperationsGuideWorkflow(id);
    if (!item) return NextResponse.json({ message: 'Workflow guide not found' }, { status: 404 });
    return NextResponse.json(item);
  }

  const items = getOperationsGuideWorkflows(category || undefined);
  return NextResponse.json(items);
}
