import { Booking, Service, Studio } from '../types/booking'

const API_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000')

export interface EmailTemplate {
  subject: string
  htmlBody: string
  textBody: string
}

export interface BookingEmailData {
  booking: Booking
  service: Service
  studio: Studio
  clientName: string
  clientEmail: string
}

export class EmailService {
  private static instance: EmailService
  
  static getInstance(): EmailService {
    if (!this.instance) {
      this.instance = new EmailService()
    }
    return this.instance
  }

  /**
   * Send booking confirmation email to client
   */
  async sendBookingConfirmation(emailData: BookingEmailData): Promise<boolean> {
    try {
      const template = this.generateBookingConfirmationTemplate(emailData)
      
      const response = await fetch(`${API_URL}/api/email/send-booking-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailData.clientEmail,
          subject: template.subject,
          htmlBody: template.htmlBody,
          textBody: template.textBody,
          bookingId: emailData.booking.id,
        }),
      })

      if (!response.ok) {
        console.error('Failed to send confirmation email:', await response.text())
        return false
      }

      return true
    } catch (error: any) {
      console.error('Email service error:', error)
      return false
    }
  }

  /**
   * Send booking reminder email to client (24h and 1h before)
   */
  async sendBookingReminder(
    emailData: BookingEmailData,
    reminderType: '24h' | '1h'
  ): Promise<boolean> {
    try {
      const template = this.generateBookingReminderTemplate(emailData, reminderType)
      
      const response = await fetch(`${API_URL}/api/email/send-booking-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailData.clientEmail,
          subject: template.subject,
          htmlBody: template.htmlBody,
          textBody: template.textBody,
          bookingId: emailData.booking.id,
          reminderType,
        }),
      })

      if (!response.ok) {
        console.error('Failed to send reminder email:', await response.text())
        return false
      }

      return true
    } catch (error: any) {
      console.error('Email service error:', error)
      return false
    }
  }

  /**
   * Send booking cancellation email to client
   */
  async sendBookingCancellation(emailData: BookingEmailData, reason?: string): Promise<boolean> {
    try {
      const template = this.generateBookingCancellationTemplate(emailData, reason)
      
      const response = await fetch(`${API_URL}/api/email/send-booking-cancellation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailData.clientEmail,
          subject: template.subject,
          htmlBody: template.htmlBody,
          textBody: template.textBody,
          bookingId: emailData.booking.id,
          reason,
        }),
      })

      if (!response.ok) {
        console.error('Failed to send cancellation email:', await response.text())
        return false
      }

      return true
    } catch (error: any) {
      console.error('Email service error:', error)
      return false
    }
  }

  /**
   * Send booking status update email to client
   */
  async sendBookingStatusUpdate(
    emailData: BookingEmailData,
    oldStatus: string,
    newStatus: string
  ): Promise<boolean> {
    try {
      const template = this.generateStatusUpdateTemplate(emailData, oldStatus, newStatus)
      
      const response = await fetch(`${API_URL}/api/email/send-status-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailData.clientEmail,
          subject: template.subject,
          htmlBody: template.htmlBody,
          textBody: template.textBody,
          bookingId: emailData.booking.id,
          oldStatus,
          newStatus,
        }),
      })

      if (!response.ok) {
        console.error('Failed to send status update email:', await response.text())
        return false
      }

      return true
    } catch (error: any) {
      console.error('Email service error:', error)
      return false
    }
  }

  /**
   * Send new booking notification to studio owner
   */
  async sendStudioNotification(emailData: BookingEmailData): Promise<boolean> {
    try {
      const template = this.generateStudioNotificationTemplate(emailData)
      
      const response = await fetch(`${API_URL}/api/email/send-studio-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailData.studio.email,
          subject: template.subject,
          htmlBody: template.htmlBody,
          textBody: template.textBody,
          bookingId: emailData.booking.id,
        }),
      })

      if (!response.ok) {
        console.error('Failed to send studio notification:', await response.text())
        return false
      }

      return true
    } catch (error: any) {
      console.error('Email service error:', error)
      return false
    }
  }

  // Template generators
  private generateBookingConfirmationTemplate(emailData: BookingEmailData): EmailTemplate {
    const { booking, service, studio } = emailData
    const bookingDate = new Date(booking.start_time)
    const endDate = new Date(booking.end_time)

    const subject = `Booking Confirmed - ${studio.name}`

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2081C3; color: white; padding: 20px; text-align: center;">
          <h1>${studio.name}</h1>
          <h2>Booking Confirmed! 🎵</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3>Hi ${booking.client_name},</h3>
            <p>Your booking has been confirmed! Here are the details:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0;">Booking Details</h4>
              <p><strong>Service:</strong> ${service.name}</p>
              <p><strong>Date:</strong> ${bookingDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Time:</strong> ${bookingDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              })} - ${endDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              })}</p>
              <p><strong>Duration:</strong> ${Math.round((endDate.getTime() - bookingDate.getTime()) / (1000 * 60))} minutes</p>
              <p><strong>Total:</strong> $${(booking.total_price_cents / 100).toFixed(2)}</p>
            </div>

            ${studio.address ? `
              <h4>Studio Location</h4>
              <p>${studio.address}</p>
            ` : ''}

            <h4>Important Notes</h4>
            <ul>
              <li>Please arrive 10-15 minutes before your scheduled time</li>
              <li>Bring any instruments, equipment, or materials you'll need</li>
              <li>Contact us directly if you need to reschedule or have questions</li>
            </ul>

            ${studio.phone || studio.email ? `
              <h4>Contact Information</h4>
              ${studio.phone ? `<p>📞 ${studio.phone}</p>` : ''}
              ${studio.email ? `<p>📧 ${studio.email}</p>` : ''}
            ` : ''}

            <p>We're excited to work with you!</p>
            <p>Best regards,<br>The ${studio.name} Team</p>
          </div>
        </div>
      </div>
    `

    const textBody = `
Booking Confirmed - ${studio.name}

Hi ${booking.client_name},

Your booking has been confirmed! Here are the details:

Service: ${service.name}
Date: ${bookingDate.toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}
Time: ${bookingDate.toLocaleTimeString('en-US', { 
  hour: 'numeric', 
  minute: '2-digit', 
  hour12: true 
})} - ${endDate.toLocaleTimeString('en-US', { 
  hour: 'numeric', 
  minute: '2-digit', 
  hour12: true 
})}
Duration: ${Math.round((endDate.getTime() - bookingDate.getTime()) / (1000 * 60))} minutes
Total: $${(booking.total_price_cents / 100).toFixed(2)}

${studio.address ? `Studio Location: ${studio.address}` : ''}

Important Notes:
- Please arrive 10-15 minutes before your scheduled time
- Bring any instruments, equipment, or materials you'll need
- Contact us directly if you need to reschedule or have questions

${studio.phone ? `Phone: ${studio.phone}` : ''}
${studio.email ? `Email: ${studio.email}` : ''}

We're excited to work with you!

Best regards,
The ${studio.name} Team
    `

    return { subject, htmlBody, textBody }
  }

  private generateBookingReminderTemplate(
    emailData: BookingEmailData,
    reminderType: '24h' | '1h'
  ): EmailTemplate {
    const { booking, service, studio } = emailData
    const bookingDate = new Date(booking.start_time)
    const timeFrame = reminderType === '24h' ? 'tomorrow' : 'in 1 hour'
    const urgency = reminderType === '1h' ? 'Soon! ' : ''

    const subject = `${urgency}Reminder: Your session ${timeFrame} at ${studio.name}`

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2081C3; color: white; padding: 20px; text-align: center;">
          <h1>${studio.name}</h1>
          <h2>${urgency}Session Reminder 🔔</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 20px; border-radius: 8px;">
            <h3>Hi ${booking.client_name},</h3>
            <p>This is a friendly reminder about your upcoming session ${timeFrame}!</p>
            
            <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2081C3;">
              <h4 style="margin-top: 0;">Session Details</h4>
              <p><strong>Service:</strong> ${service.name}</p>
              <p><strong>Date:</strong> ${bookingDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Time:</strong> ${bookingDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              })}</p>
            </div>

            ${reminderType === '1h' ? `
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p><strong>⚠️ Please head to the studio soon!</strong></p>
                <p>Remember to arrive 10-15 minutes early.</p>
              </div>
            ` : ''}

            ${studio.address ? `
              <p><strong>Location:</strong> ${studio.address}</p>
            ` : ''}

            <p>Looking forward to seeing you!</p>
            <p>Best regards,<br>The ${studio.name} Team</p>
          </div>
        </div>
      </div>
    `

    const textBody = `
Session Reminder - ${studio.name}

Hi ${booking.client_name},

This is a friendly reminder about your upcoming session ${timeFrame}!

Service: ${service.name}
Date: ${bookingDate.toLocaleDateString('en-US', { 
  weekday: 'long', 
  month: 'long', 
  day: 'numeric' 
})}
Time: ${bookingDate.toLocaleTimeString('en-US', { 
  hour: 'numeric', 
  minute: '2-digit', 
  hour12: true 
})}

${studio.address ? `Location: ${studio.address}` : ''}

${reminderType === '1h' ? 'Please head to the studio soon! Remember to arrive 10-15 minutes early.' : ''}

Looking forward to seeing you!

Best regards,
The ${studio.name} Team
    `

    return { subject, htmlBody, textBody }
  }

  private generateBookingCancellationTemplate(
    emailData: BookingEmailData,
    reason?: string
  ): EmailTemplate {
    const { booking, service, studio } = emailData
    const bookingDate = new Date(booking.start_time)

    const subject = `Booking Cancelled - ${studio.name}`

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
          <h1>${studio.name}</h1>
          <h2>Booking Cancelled</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 20px; border-radius: 8px;">
            <h3>Hi ${booking.client_name},</h3>
            <p>We're writing to inform you that your booking has been cancelled.</p>
            
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h4 style="margin-top: 0;">Cancelled Booking</h4>
              <p><strong>Service:</strong> ${service.name}</p>
              <p><strong>Date:</strong> ${bookingDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Time:</strong> ${bookingDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              })}</p>
            </div>

            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}

            <p>If you have any questions about this cancellation or would like to reschedule, please don't hesitate to contact us.</p>
            
            <p>We apologize for any inconvenience.</p>
            <p>Best regards,<br>The ${studio.name} Team</p>
          </div>
        </div>
      </div>
    `

    const textBody = `
Booking Cancelled - ${studio.name}

Hi ${booking.client_name},

We're writing to inform you that your booking has been cancelled.

Cancelled Booking:
Service: ${service.name}
Date: ${bookingDate.toLocaleDateString('en-US', { 
  weekday: 'long', 
  month: 'long', 
  day: 'numeric' 
})}
Time: ${bookingDate.toLocaleTimeString('en-US', { 
  hour: 'numeric', 
  minute: '2-digit', 
  hour12: true 
})}

${reason ? `Reason: ${reason}` : ''}

If you have any questions about this cancellation or would like to reschedule, please don't hesitate to contact us.

We apologize for any inconvenience.

Best regards,
The ${studio.name} Team
    `

    return { subject, htmlBody, textBody }
  }

  private generateStatusUpdateTemplate(
    emailData: BookingEmailData,
    oldStatus: string,
    newStatus: string
  ): EmailTemplate {
    const { booking, service, studio } = emailData
    const bookingDate = new Date(booking.start_time)

    const subject = `Booking Update - ${studio.name}`

    const statusMessages = {
      confirmed: 'Your booking has been confirmed and is ready to go! 🎉',
      in_progress: 'Your session has started! 🎵',
      completed: 'Your session has been completed! Thank you! ✅',
      cancelled: 'Your booking has been cancelled.',
      no_show: 'You missed your scheduled appointment.'
    }

    const message = statusMessages[newStatus as keyof typeof statusMessages] || 'Your booking status has been updated.'

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2081C3; color: white; padding: 20px; text-align: center;">
          <h1>${studio.name}</h1>
          <h2>Booking Update</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 20px; border-radius: 8px;">
            <h3>Hi ${booking.client_name},</h3>
            <p>${message}</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0;">Booking Details</h4>
              <p><strong>Service:</strong> ${service.name}</p>
              <p><strong>Date:</strong> ${bookingDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Time:</strong> ${bookingDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              })}</p>
              <p><strong>Status:</strong> ${newStatus.replace('_', ' ').toUpperCase()}</p>
            </div>

            <p>If you have any questions, please contact us.</p>
            <p>Best regards,<br>The ${studio.name} Team</p>
          </div>
        </div>
      </div>
    `

    const textBody = `
Booking Update - ${studio.name}

Hi ${booking.client_name},

${message}

Booking Details:
Service: ${service.name}
Date: ${bookingDate.toLocaleDateString('en-US', { 
  weekday: 'long', 
  month: 'long', 
  day: 'numeric' 
})}
Time: ${bookingDate.toLocaleTimeString('en-US', { 
  hour: 'numeric', 
  minute: '2-digit', 
  hour12: true 
})}
Status: ${newStatus.replace('_', ' ').toUpperCase()}

If you have any questions, please contact us.

Best regards,
The ${studio.name} Team
    `

    return { subject, htmlBody, textBody }
  }

  private generateStudioNotificationTemplate(emailData: BookingEmailData): EmailTemplate {
    const { booking, service, studio } = emailData
    const bookingDate = new Date(booking.start_time)
    const endDate = new Date(booking.end_time)

    const subject = `New Booking: ${booking.client_name} - ${service.name}`

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
          <h1>New Booking Received! 🎉</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 20px; border-radius: 8px;">
            <h3>New booking for ${studio.name}</h3>
            
            <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h4 style="margin-top: 0;">Booking Details</h4>
              <p><strong>Client:</strong> ${booking.client_name}</p>
              <p><strong>Email:</strong> ${booking.client_email}</p>
              ${booking.client_phone ? `<p><strong>Phone:</strong> ${booking.client_phone}</p>` : ''}
              <p><strong>Service:</strong> ${service.name}</p>
              <p><strong>Date:</strong> ${bookingDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Time:</strong> ${bookingDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              })} - ${endDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              })}</p>
              <p><strong>Total:</strong> $${(booking.total_price_cents / 100).toFixed(2)}</p>
              <p><strong>Status:</strong> ${booking.status.replace('_', ' ').toUpperCase()}</p>
            </div>

            ${booking.notes ? `
              <div style="background-color: #fef9e7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0;">Client Notes</h4>
                <p>${booking.notes}</p>
              </div>
            ` : ''}

            <p>Login to your admin dashboard to manage this booking.</p>
          </div>
        </div>
      </div>
    `

    const textBody = `
New Booking Received!

New booking for ${studio.name}

Client: ${booking.client_name}
Email: ${booking.client_email}
${booking.client_phone ? `Phone: ${booking.client_phone}` : ''}
Service: ${service.name}
Date: ${bookingDate.toLocaleDateString('en-US', { 
  weekday: 'long', 
  month: 'long', 
  day: 'numeric' 
})}
Time: ${bookingDate.toLocaleTimeString('en-US', { 
  hour: 'numeric', 
  minute: '2-digit', 
  hour12: true 
})} - ${endDate.toLocaleTimeString('en-US', { 
  hour: 'numeric', 
  minute: '2-digit', 
  hour12: true 
})}
Total: $${(booking.total_price_cents / 100).toFixed(2)}
Status: ${booking.status.replace('_', ' ').toUpperCase()}

${booking.notes ? `Client Notes: ${booking.notes}` : ''}

Login to your admin dashboard to manage this booking.
    `

    return { subject, htmlBody, textBody }
  }
}

export const emailService = EmailService.getInstance()