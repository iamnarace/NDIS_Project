import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'data', 'participants.json');

function getData() {
  try {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

export async function GET() {
  return NextResponse.json(getData());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = getData();
    const newId = `PAR-${String(data.length + 1).padStart(3, '0')}`;
    const newPart = { id: newId, ...body, status: 'active', createdAt: new Date().toISOString() };
    data.push(newPart);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    return NextResponse.json({ ok: true, participant: newPart });
  } catch (err) {
    return NextResponse.json({ message: 'Failed to create participant' }, { status: 500 });
  }
}
