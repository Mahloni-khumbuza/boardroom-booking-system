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

export interface ApprovalRequestEmailContext {
  bookerName: string;
  boardroomName: string;
  bookingTitle: string;
  startTime: Date;
  endTime: Date;
  attendeeCount: number;
  meetingType: string;
}

export interface FacilitiesRequestEmailContext {
  boardroomName: string;
  bookingTitle: string;
  startTime: Date;
  endTime: Date;
  bookerName: string;
  requiresCatering: boolean;
  cateringNotes: string | null;
  requiresSetup: boolean;
  setupNotes: string | null;
}

export interface RoomBlockedEmailContext {
  boardroomName: string;
  startTime: Date;
  endTime: Date;
  reason: string;
  blockedByName: string;
}

export interface BookingUpdateEmailContext {
  recipientName: string;
  boardroomName: string;
  bookingTitle: string;
  startTime: Date;
  endTime: Date;
  changedBy: string;
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

// ── §12: Booking created (pending approval path) ─────────────────────────
export function bookingCreatedHtml(ctx: BookingEmailContext): string {
  return wrap('Booking Submitted — Awaiting Approval', `
    <p>Dear ${ctx.userName},</p>
    <p>Your booking request has been submitted and is <strong>awaiting approval</strong>.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px;font-weight:bold;width:40%">Title</td><td style="padding:6px">${ctx.bookingTitle}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Room</td><td style="padding:6px">${ctx.boardroomName}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Start</td><td style="padding:6px">${formatDate(ctx.startTime)}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">End</td><td style="padding:6px">${formatDate(ctx.endTime)}</td></tr>
    </table>
    <p>You will be notified once your booking is approved or rejected.</p>`);
}

// ── §12: Booking created (instant approval path) ──────────────────────────
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

// ── §12: Booking requires approval → Admin/FM ─────────────────────────────
export function approvalRequestHtml(ctx: ApprovalRequestEmailContext): string {
  return wrap('Booking Requires Your Approval', `
    <p>A new booking request requires your approval.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px;font-weight:bold;width:40%">Requested by</td><td style="padding:6px">${ctx.bookerName}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Title</td><td style="padding:6px">${ctx.bookingTitle}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Room</td><td style="padding:6px">${ctx.boardroomName}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Start</td><td style="padding:6px">${formatDate(ctx.startTime)}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">End</td><td style="padding:6px">${formatDate(ctx.endTime)}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Attendees</td><td style="padding:6px">${ctx.attendeeCount}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Meeting type</td><td style="padding:6px">${ctx.meetingType}</td></tr>
    </table>
    <p>Please log in to the Boardroom Booking System to approve or reject this request.</p>`);
}

// ── §12: Booking updated → Booker + Admins ────────────────────────────────
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

export function bookingUpdatedAdminHtml(ctx: BookingUpdateEmailContext): string {
  return wrap('Booking Updated — Change Summary', `
    <p>Dear ${ctx.recipientName},</p>
    <p>A booking has been updated by <strong>${ctx.changedBy}</strong>.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px;font-weight:bold;width:40%">Title</td><td style="padding:6px">${ctx.bookingTitle}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Room</td><td style="padding:6px">${ctx.boardroomName}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Start</td><td style="padding:6px">${formatDate(ctx.startTime)}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">End</td><td style="padding:6px">${formatDate(ctx.endTime)}</td></tr>
    </table>`);
}

// ── §12: Booking cancelled → Booker + Admins ─────────────────────────────
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

export function bookingCancelledAdminHtml(ctx: BookingEmailContext & { cancelledByName: string }): string {
  const reasonRow = ctx.cancellationReason
    ? `<tr><td style="padding:6px;font-weight:bold">Reason</td><td style="padding:6px">${ctx.cancellationReason}</td></tr>`
    : '';
  return wrap('Booking Cancelled — Notice', `
    <p>A booking has been cancelled by <strong>${ctx.cancelledByName}</strong>.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px;font-weight:bold;width:40%">Title</td><td style="padding:6px">${ctx.bookingTitle}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Room</td><td style="padding:6px">${ctx.boardroomName}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Start</td><td style="padding:6px">${formatDate(ctx.startTime)}</td></tr>
      ${reasonRow}
    </table>`);
}

// ── §12: Booking rejected → Booker ───────────────────────────────────────
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

// ── §12: Meeting starts soon → Booker ────────────────────────────────────
export function bookingReminderHtml(ctx: BookingEmailContext): string {
  return wrap(`Reminder: Your Booking Starts in ${ctx.reminderMinutes} Minutes`, `
    <p>Dear ${ctx.userName},</p>
    <p>This is a reminder that your booking starts in <strong>${ctx.reminderMinutes} minutes</strong>.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px;font-weight:bold;width:40%">Title</td><td style="padding:6px">${ctx.bookingTitle}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Room</td><td style="padding:6px">${ctx.boardroomName}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Start</td><td style="padding:6px">${formatDate(ctx.startTime)}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">End</td><td style="padding:6px">${formatDate(ctx.endTime)}</td></tr>
    </table>`);
}

// ── §12: Setup or catering required → Facilities Manager ─────────────────
export function facilitiesRequestHtml(ctx: FacilitiesRequestEmailContext): string {
  const rows: string[] = [];
  if (ctx.requiresCatering) {
    rows.push(`<tr><td style="padding:6px;font-weight:bold;width:40%">Catering</td><td style="padding:6px">${ctx.cateringNotes || 'Required — no specific notes'}</td></tr>`);
  }
  if (ctx.requiresSetup) {
    rows.push(`<tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Room setup</td><td style="padding:6px">${ctx.setupNotes || 'Required — no specific notes'}</td></tr>`);
  }
  return wrap('Facilities Request — Action Required', `
    <p>An upcoming booking requires your attention.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px;font-weight:bold;width:40%">Booking</td><td style="padding:6px">${ctx.bookingTitle}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Room</td><td style="padding:6px">${ctx.boardroomName}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Start</td><td style="padding:6px">${formatDate(ctx.startTime)}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Requested by</td><td style="padding:6px">${ctx.bookerName}</td></tr>
      ${rows.join('')}
    </table>
    <p>Please ensure the room is prepared before the booking start time.</p>`);
}

// ── §12: Room blocked → Admins + FM ──────────────────────────────────────
export function roomBlockedHtml(ctx: RoomBlockedEmailContext): string {
  return wrap('Room Blocked — Availability Notice', `
    <p>A boardroom has been blocked and is no longer available for bookings during the specified period.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px;font-weight:bold;width:40%">Room</td><td style="padding:6px">${ctx.boardroomName}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">From</td><td style="padding:6px">${formatDate(ctx.startTime)}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">To</td><td style="padding:6px">${formatDate(ctx.endTime)}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-weight:bold">Reason</td><td style="padding:6px">${ctx.reason}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Blocked by</td><td style="padding:6px">${ctx.blockedByName}</td></tr>
    </table>
    <p>Any existing approved bookings that conflict with this block may need to be reviewed.</p>`);
}
