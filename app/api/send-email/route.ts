import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const { fullName, email, idNumber } = await request.json()

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Your Tutorverse verification is being processed',
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #fff;">
          <div style="margin-bottom: 32px;">
            <span style="font-size: 20px; font-weight: 700; color: #000;">✕ Tutorverse</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 700; color: #000; margin-bottom: 12px;">Documents received</h1>
          <p style="font-size: 15px; color: #888; line-height: 1.6; margin-bottom: 24px;">
            Hi ${fullName}, we've received your identity documents and your verification is now being processed.
          </p>
          <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;">Submission details</p>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 14px; color: #555;">Full name</span>
              <span style="font-size: 14px; font-weight: 600; color: #000;">${fullName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 14px; color: #555;">ID number</span>
              <span style="font-size: 14px; font-weight: 600; color: #000;">${idNumber}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 14px; color: #555;">Status</span>
              <span style="font-size: 13px; font-weight: 600; color: #888; background: #e8e8e8; padding: 2px 10px; border-radius: 20px;">Pending review</span>
            </div>
          </div>
          <p style="font-size: 14px; color: #888; line-height: 1.6;">
            We'll notify you once your verification is complete. This usually takes 1-2 business days.
          </p>
          <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 32px 0;">
          <p style="font-size: 12px; color: #ccc;">© 2026 Tutorverse (Pty) Ltd · Protected by POPIA</p>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}