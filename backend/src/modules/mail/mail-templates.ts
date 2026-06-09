export interface BookingEmailContext {
  userName: string;
  boardroomName: string;
  bookingTitle: string;
  startTime: Date;
  endTime: Date;
  status?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  reminderMinutes?: number;
}

function formatDate(d: Date): string {
  return d.toLocaleString('en-ZA', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function wrap(title: string, body: string): string {
  return `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#1e3a5f;padding:16px 24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0">Boardroom Booking System</h2>
  </div>
  <div style="border:1px solid #ddd;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <h3 style="margin-top:0">${title}</h3>
    ${body}
    <p style="margin-top:24px;font-size:12px;color:#888">This is an automated message. Please do not reply to this email.</p>
  </div>
</body></html>`;
}

export function bookingCreatedHtml(ctx: BookingEmailContext): string {
  return wrap('Booking Submitted', `
    <p>Dear ${ctx.userName},</p>
    <p>Your booking has been submitted and is <strong>awaiting approval</strong>.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px;font-weight:bold;width:40%">Title</td><td style="padding:6px">${ctx.bookingTitle}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Room</td><td style="padding:6px">${ctx.boardroomName}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Start</td><td style="padding:6px">${formatDate(ctx.startTime)}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">End</td><td style="padding:6px">${formatDate(ctx.endTime)}</td></tr>
    </table>
    <p>You will be notified once your booking is approved or rejected.</p>`);
}

export function bookingConfirmedHtml(ctx: BookingEmailContext): string {
  return wrap('Booking Confirmed', `
    <p>Dear ${ctx.userName},</p>
    <p>Your booking has been <strong style="color:#16a34a">confirmed</strong>.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px;font-weight:bold;width:40%">Title</td><td style="padding:6px">${ctx.bookingTitle}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Room</td><td style="padding:6px">${ctx.boardroomName}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Start</td><td style="padding:6px">${formatDate(ctx.startTime)}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">End</td><td style="padding:6px">${formatDate(ctx.endTime)}</td></tr>
    </table>`);
}

export function bookingUpdatedHtml(ctx: BookingEmailContext): string {
  return wrap('Booking Updated', `
    <p>Dear ${ctx.userName},</p>
    <p>Your booking has been <strong>updated</strong>. The current details are:</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px;font-weight:bold;width:40%">Title</td><td style="padding:6px">${ctx.bookingTitle}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Room</td><td style="padding:6px">${ctx.boardroomName}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Start</td><td style="padding:6px">${formatDate(ctx.startTime)}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">End</td><td style="padding:6px">${formatDate(ctx.endTime)}</td></tr>
    </table>`);
}

export function bookingCancelledHtml(ctx: BookingEmailContext): string {
  const reasonRow = ctx.cancellationReason
    ? `<tr><td style="padding:6px;font-weight:bold">Reason</td><td style="padding:6px">${ctx.cancellationReason}</td></tr>`
    : '';
  return wrap('Booking Cancelled', `
    <p>Dear ${ctx.userName},</p>
    <p>Your booking has been <strong style="color:#dc2626">cancelled</strong>.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px;font-weight:bold;width:40%">Title</td><td style="padding:6px">${ctx.bookingTitle}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Room</td><td style="padding:6px">${ctx.boardroomName}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Start</td><td style="padding:6px">${formatDate(ctx.startTime)}</td></tr>
      ${reasonRow}
    </table>`);
}

export function bookingRejectedHtml(ctx: BookingEmailContext): string {
  const reasonRow = ctx.rejectionReason
    ? `<tr><td style="padding:6px;font-weight:bold">Reason</td><td style="padding:6px">${ctx.rejectionReason}</td></tr>`
    : '';
  return wrap('Booking Rejected', `
    <p>Dear ${ctx.userName},</p>
    <p>Unfortunately your booking request has been <strong style="color:#dc2626">rejected</strong>.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px;font-weight:bold;width:40%">Title</td><td style="padding:6px">${ctx.bookingTitle}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Room</td><td style="padding:6px">${ctx.boardroomName}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Start</td><td style="padding:6px">${formatDate(ctx.startTime)}</td></tr>
      ${reasonRow}
    </table>
    <p>You may submit a new booking request if you wish.</p>`);
}

export function bookingReminderHtml(ctx: BookingEmailContext): string {
  return wrap(`Reminder: Booking in ${ctx.reminderMinutes} minutes`, `
    <p>Dear ${ctx.userName},</p>
    <p>This is a reminder that your booking starts in <strong>${ctx.reminderMinutes} minutes</strong>.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px;font-weight:bold;width:40%">Title</td><td style="padding:6px">${ctx.bookingTitle}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Room</td><td style="padding:6px">${ctx.boardroomName}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Start</td><td style="padding:6px">${formatDate(ctx.startTime)}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">End</td><td style="padding:6px">${formatDate(ctx.endTime)}</td></tr>
    </table>`);
}
