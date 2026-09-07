import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'data', 'staff.json');

function getData() {
  try {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }
  return NextResponse.json(getData());
}

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = getData();
    const newId = `STF-${String(data.length + 1).padStart(3, '0')}`;
    const newStaff = { id: newId, ...body, status: 'active', createdAt: new Date().toISOString() };
    data.push(newStaff);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    return NextResponse.json({ ok: true, staff: newStaff });
  } catch (err) {
    return NextResponse.json({ message: 'Failed to create staff' }, { status: 500 });
  }
}
