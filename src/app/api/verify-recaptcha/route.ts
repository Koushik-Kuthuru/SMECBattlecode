
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!token) {
      return NextResponse.json({ success: false, message: 'reCAPTCHA token is missing.' }, { status: 400 });
    }

    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    const response = await fetch(verificationUrl, {
      method: 'POST',
    });

    const data = await response.json();

    if (data.success) {
      return NextResponse.json({ success: true, message: 'reCAPTCHA verified successfully.' }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: 'Failed to verify reCAPTCHA.', errors: data['error-codes'] }, { status: 400 });
    }
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
