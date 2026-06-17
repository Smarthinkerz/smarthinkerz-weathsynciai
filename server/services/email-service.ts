import nodemailer from 'nodemailer';

// Configure nodemailer
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!process.env.EMAIL_SMTP_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
    secure: process.env.EMAIL_SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  return transporter;
}

/**
 * Send an email
 * @param to Recipient email address
 * @param subject Email subject
 * @param text Plain text content
 * @param html Optional HTML content
 * @returns Promise resolving to send status
 */
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const mailer = getTransporter();
    if (!mailer) {
      console.error('Email service not configured — missing EMAIL_SMTP_HOST, EMAIL_USER, or EMAIL_PASSWORD');
      return {
        success: false,
        message: 'Email service not configured',
      };
    }

    await mailer.sendMail({
      from: process.env.EMAIL_FROM || '"WealthSync AI" <noreply@wealthsync.ai>',
      to,
      subject,
      text,
      html: html || text,
    });

    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error sending email',
    };
  }
}

/**
 * Schedule a meeting and send calendar invitation
 * @param organizer Organizer email address
 * @param attendees Array of attendee email addresses
 * @param subject Meeting subject
 * @param description Meeting description
 * @param startTime Start time of meeting (ISO string)
 * @param endTime End time of meeting (ISO string)
 * @param location Optional location
 * @returns Promise resolving to appointment creation status
 */
export async function scheduleAppointment(
  organizer: string,
  attendees: string[],
  subject: string,
  description: string,
  startTime: string,
  endTime: string,
  location?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const mailer = getTransporter();
    if (!mailer) {
      console.error('Email service not configured — missing EMAIL_SMTP_HOST, EMAIL_USER, or EMAIL_PASSWORD');
      return {
        success: false,
        message: 'Email service not configured',
      };
    }

    // Create iCalendar format content for calendar invite
    const uid = `appointment-${Date.now()}@wealthsync.ai`;
    const dateNow = new Date().toISOString().replace(/[-:.]/g, '');
    const start = new Date(startTime).toISOString().replace(/[-:.]/g, '').slice(0, -4) + 'Z';
    const end = new Date(endTime).toISOString().replace(/[-:.]/g, '').slice(0, -4) + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//WealthSync AI//Meeting Scheduler//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dateNow}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `ORGANIZER;CN=${organizer}:mailto:${organizer}`,
      ...attendees.map(attendee => `ATTENDEE;RSVP=TRUE;ROLE=REQ-PARTICIPANT:mailto:${attendee}`),
      `SUMMARY:${subject}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      `LOCATION:${location || 'Virtual Meeting'}`,
      'SEQUENCE:0',
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    // Send email with calendar attachment
    await mailer.sendMail({
      from: process.env.EMAIL_FROM || `"WealthSync AI" <${organizer}>`,
      to: attendees.join(','),
      subject: `Meeting Invitation: ${subject}`,
      text: `
You've been invited to a meeting: ${subject}

Time: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}
Location: ${location || 'Virtual Meeting'}

Details:
${description}

This invitation was sent via WealthSync AI.
      `,
      icalEvent: {
        filename: 'invitation.ics',
        method: 'REQUEST',
        content: icsContent,
      },
    });

    return {
      success: true,
      message: 'Appointment scheduled and invitations sent',
    };
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error scheduling appointment',
    };
  }
}