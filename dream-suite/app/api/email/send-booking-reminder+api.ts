import { ExpoRequest, ExpoResponse } from 'expo-router/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: ExpoRequest): Promise<Response> {
  try {
    const body = await request.json()
    const { to, subject, htmlBody, textBody, bookingId, reminderType } = body

    if (!to || !subject || !htmlBody || !reminderType) {
      return Response.json(
        { error: 'Missing required fields: to, subject, htmlBody, reminderType' },
        { status: 400 }
      )
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Dream Suite <bookings@dreamsuite.com>',
      to: [to],
      subject: subject,
      html: htmlBody,
      text: textBody,
      tags: [
        { name: 'type', value: 'booking-reminder' },
        { name: 'booking_id', value: bookingId },
        { name: 'reminder_type', value: reminderType },
      ],
    })

    if (error) {
      console.error('Resend error:', error)
      return Response.json(
        { error: 'Failed to send email', details: error.message },
        { status: 500 }
      )
    }

    console.log(`Booking reminder (${reminderType}) email sent:`, data?.id)

    return Response.json({
      success: true,
      messageId: data?.id,
    })

  } catch (error: any) {
    console.error('Error sending booking reminder:', error)
    return Response.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    )
  }
}