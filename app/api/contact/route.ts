import { NextResponse } from 'next/server';
import { sendContactEmails } from '@/lib/email';

function text(value: unknown, max = 2500) {
  return String(value ?? '').trim().slice(0, max);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = text(body.name, 160);
    const email = text(body.email, 200);
    const message = text(body.message, 2500);

    if (!name || !email || !message) {
      return NextResponse.json({ message: 'Please provide your name, email and message.' }, { status: 400 });
    }

    const result = await sendContactEmails({
      name,
      email,
      phone: text(body.phone, 80) || undefined,
      subject: text(body.subject, 200) || 'Website enquiry',
      message,
    });

    if (!result.ok) {
      return NextResponse.json({ message: 'Unable to send enquiry at this time.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, message: 'Enquiry sent successfully.' });
  } catch (error) {
    console.error('Contact submission error', error);
    return NextResponse.json({ message: 'Error processing contact enquiry.' }, { status: 500 });
  }
}
