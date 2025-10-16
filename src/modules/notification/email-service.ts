import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail(params: EmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured. Email not sent.")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const result = await resend.emails.send({
      from: params.from || process.env.EMAIL_FROM || "SkinLair <noreply@skinlair.com>",
      to: params.to,
      subject: params.subject,
      html: params.html,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Email send error:", error)
    return { success: false, error }
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmation(booking: any) {
  const formattedDate = new Date(booking.scheduled_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedTime = formatTime(booking.scheduled_time)

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; margin: 20px 0; }
          .booking-details { background-color: #fff; padding: 20px; border-left: 4px solid #000; margin: 20px 0; }
          .booking-details p { margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmation</h1>
          </div>
          <div class="content">
            <h2>Hi ${booking.customer_name},</h2>
            <p>Thank you for booking with SkinLair! Your appointment has been confirmed.</p>
            
            <div class="booking-details">
              <h3>Appointment Details</h3>
              <p><strong>Service:</strong> ${booking.service_name}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${formattedTime}</p>
              <p><strong>Duration:</strong> ${booking.service_duration} minutes</p>
              <p><strong>Price:</strong> $${(booking.service_price / 100).toFixed(2)}</p>
              ${booking.staff_name ? `<p><strong>Staff:</strong> ${booking.staff_name}</p>` : ''}
              ${booking.notes ? `<p><strong>Your Notes:</strong> ${booking.notes}</p>` : ''}
            </div>

            ${booking.deposit_amount ? `
              <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <p><strong>Deposit Required:</strong> $${(booking.deposit_amount / 100).toFixed(2)}</p>
                <p>Please complete your deposit payment to confirm your appointment.</p>
              </div>
            ` : ''}

            <p>We look forward to seeing you!</p>
            
            <a href="${process.env.STORE_URL || 'http://localhost:8000'}/account/bookings" class="button">
              View Booking
            </a>
          </div>
          <div class="footer">
            <p>If you need to cancel or reschedule, please contact us at least 24 hours in advance.</p>
            <p>SkinLair &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
    </html>
  `

  return await sendEmail({
    to: booking.customer_email,
    subject: `Booking Confirmation - ${booking.service_name}`,
    html,
  })
}

/**
 * Send booking reminder email
 */
export async function sendBookingReminder(booking: any) {
  const formattedDate = new Date(booking.scheduled_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedTime = formatTime(booking.scheduled_time)

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; margin: 20px 0; }
          .reminder { background-color: #fff; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Reminder</h1>
          </div>
          <div class="content">
            <h2>Hi ${booking.customer_name},</h2>
            <p>This is a friendly reminder about your upcoming appointment at SkinLair.</p>
            
            <div class="reminder">
              <h3>Tomorrow's Appointment</h3>
              <p><strong>Service:</strong> ${booking.service_name}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${formattedTime}</p>
              <p><strong>Duration:</strong> ${booking.service_duration} minutes</p>
            </div>

            <p>Please arrive 10 minutes early to complete any necessary paperwork.</p>
            <p>If you need to cancel or reschedule, please let us know as soon as possible.</p>
          </div>
          <div class="footer">
            <p>SkinLair &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
    </html>
  `

  return await sendEmail({
    to: booking.customer_email,
    subject: `Reminder: Your appointment tomorrow at ${formattedTime}`,
    html,
  })
}

/**
 * Send booking cancellation email
 */
export async function sendBookingCancellation(booking: any) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Cancelled</h1>
          </div>
          <div class="content">
            <h2>Hi ${booking.customer_name},</h2>
            <p>Your appointment has been cancelled as requested.</p>
            
            <div style="background-color: #fff; padding: 20px; margin: 20px 0;">
              <p><strong>Cancelled Appointment:</strong></p>
              <p>Service: ${booking.service_name}</p>
              <p>Date: ${new Date(booking.scheduled_date).toLocaleDateString()}</p>
              <p>Time: ${formatTime(booking.scheduled_time)}</p>
            </div>

            ${booking.deposit_paid ? `
              <p>Your deposit will be refunded within 5-7 business days.</p>
            ` : ''}

            <p>We hope to see you again soon!</p>
            
            <a href="${process.env.STORE_URL || 'http://localhost:8000'}/bookings" class="button">
              Book Again
            </a>
          </div>
          <div class="footer">
            <p>SkinLair &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
    </html>
  `

  return await sendEmail({
    to: booking.customer_email,
    subject: `Booking Cancelled - ${booking.service_name}`,
    html,
  })
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmation(payment: any, booking: any) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; margin: 20px 0; }
          .payment-details { background-color: #d4edda; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Confirmed</h1>
          </div>
          <div class="content">
            <h2>Hi ${booking.customer_name},</h2>
            <p>Thank you! Your payment has been successfully processed.</p>
            
            <div class="payment-details">
              <h3>Payment Details</h3>
              <p><strong>Amount:</strong> $${(payment.amount / 100).toFixed(2)}</p>
              <p><strong>Type:</strong> ${payment.payment_type === 'deposit' ? 'Deposit' : 'Full Payment'}</p>
              <p><strong>Status:</strong> Paid</p>
            </div>

            <div style="background-color: #fff; padding: 20px; margin: 20px 0;">
              <h3>Booking Details</h3>
              <p><strong>Service:</strong> ${booking.service_name}</p>
              <p><strong>Date:</strong> ${new Date(booking.scheduled_date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${formatTime(booking.scheduled_time)}</p>
            </div>

            <p>We look forward to seeing you at your appointment!</p>
          </div>
          <div class="footer">
            <p>SkinLair &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
    </html>
  `

  return await sendEmail({
    to: booking.customer_email,
    subject: `Payment Confirmed - $${(payment.amount / 100).toFixed(2)}`,
    html,
  })
}

/**
 * Helper function to format time
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}
