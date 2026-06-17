import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../auth/services/auth.service';
import { Boardroom, Amenity } from '../../boardrooms/models/boardroom.model';
import { BoardroomsService } from '../../boardrooms/services/boardrooms.service';
import { Booking, BookingStatus } from '../models/booking.model';
import { BookingsService } from '../services/bookings.service';
import { extractErrorMessage } from '../../../shared/utils/error.utils';

@Component({
  selector: 'app-bookings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, SpinnerComponent, MatTabsModule, ConfirmationModalComponent, StatusBadgeComponent],
  templateUrl: './bookings.page.html',
  styleUrl: './bookings.page.css',
})
export class BookingsPage {
  private readonly bookingsService  = inject(BookingsService);
  private readonly boardroomsService = inject(BoardroomsService);
  private readonly auth             = inject(AuthService);
  private readonly fb               = inject(FormBuilder);
  private readonly route            = inject(ActivatedRoute);
  private readonly toast            = inject(ToastService);

  readonly loading    = signal(false);
  readonly saving     = signal(false);
  readonly error      = signal<string | null>(null);
  readonly showCreate = signal(false);
  readonly editingId  = signal<string | null>(null);
  readonly busyId     = signal<string | null>(null);
  readonly mineOnly   = signal(false);
  readonly openMenuId = signal<string | null>(null);

  readonly PAGE_SIZE = 6;
  readonly pendingPage   = signal(0);
  readonly upcomingPage  = signal(0);
  readonly pastPage      = signal(0);
  readonly cancelledPage = signal(0);
  readonly rejectedPage  = signal(0);

  // Confirmation modal state
  readonly confirmOpen   = signal(false);
  readonly confirmConfig = signal<ConfirmationModalConfig>({ title: '', message: '' });
  private pendingConfirmAction: ((reason?: string) => void) | null = null;

  private readonly allBookings = signal<Booking[]>([]);
  readonly boardrooms          = signal<Boardroom[]>([]);

  readonly isAdmin             = computed(() => this.auth.isAdmin());
  readonly isFacilitiesManager = computed(() => this.auth.isFacilitiesManager());
  readonly canSeeAllBookings   = computed(() => this.auth.isAdmin() || this.auth.isFacilitiesManager());
  readonly canApproveBookings  = computed(() => this.auth.isAdmin() || this.auth.isFacilitiesManager());

  // §5.3: PENDING_APPROVAL — blocks availability, next: approve / reject / cancel
  readonly pendingBookings = computed(() =>
    this.allBookings().filter((b) => b.status === 'pending_approval')
  );

  // §5.3: APPROVED — blocks availability, next: update / cancel / complete / no-show
  readonly upcomingBookings = computed(() =>
    this.allBookings().filter((b) => b.status === 'approved')
  );

  // §5.3: COMPLETED + NO_SHOW — view/report only
  readonly pastBookings = computed(() =>
    this.allBookings().filter((b) => b.status === 'completed' || b.status === 'no_show')
  );

  // §5.3: CANCELLED — view only (can be permanently deleted by Admin/SuperAdmin)
  readonly cancelledBookings = computed(() =>
    this.allBookings().filter((b) => b.status === 'cancelled')
  );

  // §5.3: REJECTED — view only (can be permanently deleted by Admin/SuperAdmin)
  readonly rejectedBookings = computed(() =>
    this.allBookings().filter((b) => b.status === 'rejected')
  );

  readonly pendingPaged   = computed(() => this.paginate(this.pendingBookings(),   this.pendingPage()));
  readonly upcomingPaged  = computed(() => this.paginate(this.upcomingBookings(),  this.upcomingPage()));
  readonly pastPaged      = computed(() => this.paginate(this.pastBookings(),      this.pastPage()));
  readonly cancelledPaged = computed(() => this.paginate(this.cancelledBookings(), this.cancelledPage()));
  readonly rejectedPaged  = computed(() => this.paginate(this.rejectedBookings(),  this.rejectedPage()));

  private paginate<T>(items: T[], page: number): T[] {
    return items.slice(page * this.PAGE_SIZE, (page + 1) * this.PAGE_SIZE);
  }

  totalPages(total: number): number { return Math.ceil(total / this.PAGE_SIZE); }
  pageNumbers(total: number): number[] { return Array.from({ length: this.totalPages(total) }, (_, i) => i); }

  readonly selectedBoardroom = computed<Boardroom | null>(() => {
    const id = this.form.controls.boardroomId.value;
    return this.boardrooms().find((r) => r.id === id) ?? null;
  });

  readonly availableAmenities = computed<Amenity[]>(() => this.selectedBoardroom()?.amenities ?? []);

  private selectedAmenityIds = new Set<string>();

  readonly meetingTypes = [
    { value: 'internal',  label: 'Internal' },
    { value: 'external',  label: 'External' },
    { value: 'hybrid',    label: 'Hybrid' },
    { value: 'training',  label: 'Training' },
    { value: 'interview', label: 'Interview' },
    { value: 'other',     label: 'Other' },
  ];

  readonly form = this.fb.nonNullable.group({
    title:           ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    meetingType:     ['internal'],
    boardroomId:     ['', Validators.required],
    startTime:       ['', Validators.required],
    endTime:         ['', Validators.required],
    attendeeCount:   [1, [Validators.required, Validators.min(1)]],
    description:     [''],
    requiresCatering:[false],
    cateringNotes:   [''],
    requiresSetup:   [false],
    setupNotes:      [''],
  });

  constructor() {
    this.load();
    this.boardroomsService.list().subscribe({ next: (r) => this.boardrooms.set(r), error: () => {} });

    this.route.queryParams.subscribe((params) => {
      if (params['boardroomId']) {
        this.openCreate();
        this.form.controls.boardroomId.setValue(params['boardroomId']);
      }
    });
  }

  toggleMine(): void { this.mineOnly.set(!this.mineOnly()); this.load(); }

  readonly roleCapabilities = computed(() => {
    if (this.auth.isSuperAdmin() || this.auth.isAdmin()) {
      return [
        { label: 'View all bookings', granted: true },
        { label: 'Approve / reject bookings', granted: true },
        { label: 'Cancel any booking', granted: true },
        { label: 'Mark complete / no-show', granted: true },
        { label: 'Delete cancelled bookings', granted: true },
      ];
    }
    if (this.auth.isFacilitiesManager()) {
      return [
        { label: 'View all bookings', granted: true },
        { label: 'Approve / reject bookings', granted: true },
        { label: 'Cancel any booking', granted: true },
        { label: 'Mark complete / no-show', granted: false },
        { label: 'Delete cancelled bookings', granted: false },
      ];
    }
    return [
      { label: 'View own bookings', granted: true },
      { label: 'Create bookings', granted: true },
      { label: 'Edit pending/approved own bookings', granted: true },
      { label: 'Cancel own bookings', granted: true },
      { label: 'Approve / reject bookings', granted: false },
    ];
  });

  openCreate(): void {
    this.editingId.set(null);
    this.selectedAmenityIds = new Set();
    this.form.reset({ meetingType: 'internal', attendeeCount: 1, requiresCatering: false, requiresSetup: false });
    this.showCreate.set(true);
  }

  openEdit(b: Booking): void {
    this.editingId.set(b.id);
    this.selectedAmenityIds = new Set(b.requestedAmenities.map((a) => a.id));
    this.form.reset({
      title:           b.title,
      description:     b.description ?? '',
      boardroomId:     b.boardroom.id,
      startTime:       b.startDateTime.slice(0, 16),
      endTime:         b.endDateTime.slice(0, 16),
      attendeeCount:   b.attendeeCount,
      meetingType:     b.meetingType,
      requiresCatering: b.requiresCatering,
      cateringNotes:   b.cateringNotes ?? '',
      requiresSetup:   b.requiresSetup,
      setupNotes:      b.setupNotes ?? '',
    });
    this.form.controls.boardroomId.disable();
    this.showCreate.set(true);
  }

  closeForm(): void {
    this.showCreate.set(false); this.editingId.set(null); this.error.set(null);
    this.form.controls.boardroomId.enable();
  }

  isAmenitySelected(id: string): boolean { return this.selectedAmenityIds.has(id); }

  toggleAmenity(id: string): void {
    if (this.selectedAmenityIds.has(id)) this.selectedAmenityIds.delete(id);
    else this.selectedAmenityIds.add(id);
  }

  submitForm(): void {
    if (this.form.invalid || this.saving()) { this.form.markAllAsTouched(); return; }
    this.saving.set(true); this.error.set(null);
    const raw = this.form.getRawValue();
    const id = this.editingId();

    const payload = {
      title:            raw.title,
      description:      raw.description || undefined,
      boardroomId:      raw.boardroomId,
      startTime:        new Date(raw.startTime).toISOString(),
      endTime:          new Date(raw.endTime).toISOString(),
      attendeeCount:    raw.attendeeCount,
      meetingType:      raw.meetingType,
      requiresCatering: raw.requiresCatering,
      cateringNotes:    raw.cateringNotes || undefined,
      requiresSetup:    raw.requiresSetup,
      setupNotes:       raw.setupNotes || undefined,
      requestedAmenityIds: Array.from(this.selectedAmenityIds),
    };

    const req = id
      ? this.bookingsService.update(id, payload)
      : this.bookingsService.create(payload);

    req.subscribe({
      next: () => {
        this.saving.set(false); this.closeForm(); this.load();
        this.toast.success(id ? 'Booking updated.' : 'Booking created.');
      },
      error: (e) => { this.error.set(extractErrorMessage(e)); this.saving.set(false); },
    });
  }

  approve(b: Booking): void {
    this.openConfirm({
      title: 'Approve Booking',
      message: `Approve "${b.title}"? The booker will be notified.`,
      confirmLabel: 'Approve',
    }, () => {
      this.busyId.set(b.id);
      this.bookingsService.approve(b.id).subscribe({
        next: () => { this.busyId.set(null); this.load(); this.toast.success('Booking approved.'); },
        error: (e) => { this.toast.error(extractErrorMessage(e)); this.busyId.set(null); },
      });
    });
  }

  openReject(b: Booking): void {
    this.openConfirm({
      title: 'Reject Booking',
      message: `Provide a reason for rejecting "${b.title}". The booker will be notified by email.`,
      confirmLabel: 'Reject',
      cancelLabel: 'Cancel',
      danger: true,
      reasonLabel: 'Rejection reason',
      reasonPlaceholder: 'e.g. Room unavailable due to maintenance…',
    }, (reason) => {
      this.busyId.set(b.id);
      this.bookingsService.reject(b.id, { reason: reason ?? '' }).subscribe({
        next: () => { this.busyId.set(null); this.load(); this.toast.success('Booking rejected.'); },
        error: (e) => { this.toast.error(extractErrorMessage(e)); this.busyId.set(null); },
      });
    });
  }

  cancel(b: Booking): void {
    this.openConfirm({
      title: 'Cancel Booking',
      message: `Cancel "${b.title}"?`,
      confirmLabel: 'Cancel booking',
      cancelLabel: 'Keep',
      danger: true,
      reasonLabel: 'Reason (optional)',
      reasonPlaceholder: 'Optional reason…',
    }, (reason) => {
      this.busyId.set(b.id);
      this.bookingsService.cancel(b.id, { reason: reason || undefined }).subscribe({
        next: () => { this.busyId.set(null); this.load(); this.toast.success('Booking cancelled.'); },
        error: (e) => { this.toast.error(extractErrorMessage(e)); this.busyId.set(null); },
      });
    });
  }

  complete(b: Booking): void {
    this.openConfirm({
      title: 'Mark as Complete',
      message: `Mark "${b.title}" as completed?`,
      confirmLabel: 'Mark Complete',
    }, () => {
      this.busyId.set(b.id);
      this.bookingsService.complete(b.id).subscribe({
        next: () => { this.busyId.set(null); this.load(); this.toast.success('Booking marked complete.'); },
        error: (e) => { this.toast.error(extractErrorMessage(e)); this.busyId.set(null); },
      });
    });
  }

  noShow(b: Booking): void {
    this.openConfirm({
      title: 'Mark as No-Show',
      message: `Mark "${b.title}" as no-show?`,
      confirmLabel: 'Mark No-Show',
      danger: true,
    }, () => {
      this.busyId.set(b.id);
      this.bookingsService.noShow(b.id).subscribe({
        next: () => { this.busyId.set(null); this.load(); this.toast.success('Booking marked no-show.'); },
        error: (e) => { this.toast.error(extractErrorMessage(e)); this.busyId.set(null); },
      });
    });
  }

  deleteBooking(b: Booking): void {
    this.openConfirm({
      title: 'Delete Booking',
      message: `Permanently delete "${b.title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    }, () => {
      this.busyId.set(b.id);
      this.bookingsService.remove(b.id).subscribe({
        next: () => { this.busyId.set(null); this.load(); this.toast.success('Booking deleted.'); },
        error: (e) => { this.toast.error(extractErrorMessage(e)); this.busyId.set(null); },
      });
    });
  }

  onConfirmed(reason?: string): void {
    this.confirmOpen.set(false);
    this.pendingConfirmAction?.(reason);
    this.pendingConfirmAction = null;
  }

  onCancelled(): void {
    this.confirmOpen.set(false);
    this.pendingConfirmAction = null;
  }

  private openConfirm(config: ConfirmationModalConfig, action: (reason?: string) => void): void {
    this.confirmConfig.set(config);
    this.pendingConfirmAction = action;
    this.confirmOpen.set(true);
  }

  private currentUserId(): string | undefined {
    return this.auth.user()?.id;
  }

  private isOwnBooking(b: Booking): boolean {
    return b.bookedByUser?.id === this.currentUserId();
  }

  toggleMenu(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  closeMenu(): void { this.openMenuId.set(null); }

  hasAnyAction(b: Booking): boolean {
    return this.canApprove(b) || this.canReject(b) || this.canEdit(b) ||
           this.canCancel(b) || this.canNoShow(b) || this.canComplete(b) || this.canDelete(b);
  }

  canApprove(b: Booking): boolean  { return this.canApproveBookings() && b.status === 'pending_approval'; }
  canReject(b: Booking): boolean   { return this.canApproveBookings() && b.status === 'pending_approval'; }
  canEdit(b: Booking): boolean {
    const editable = b.status === 'pending_approval' || b.status === 'approved';
    if (this.canSeeAllBookings()) return editable;
    return editable && this.isOwnBooking(b);
  }
  canCancel(b: Booking): boolean {
    const cancellable = b.status === 'pending_approval' || b.status === 'approved';
    if (this.canSeeAllBookings()) return cancellable;
    return cancellable && this.isOwnBooking(b);
  }
  // Brief §5.3: REJECTED and CANCELLED are terminal — view only. SuperAdmin/Admin can permanently delete both.
  canDelete(b: Booking): boolean   { return this.isAdmin() && (b.status === 'cancelled' || b.status === 'rejected'); }
  // Brief §5.3: APPROVED next actions = Update, cancel, complete or mark no-show (no time restriction stated)
  canComplete(b: Booking): boolean { return this.canApproveBookings() && b.status === 'approved'; }
  canNoShow(b: Booking): boolean   { return this.canApproveBookings() && b.status === 'approved'; }

  bookerLabel(b: Booking): string {
    if (!b.bookedByUser) return '—';
    return `${b.bookedByUser.firstName} ${b.bookedByUser.lastName}`.trim();
  }

  statusLabel(status: BookingStatus): string {
    const map: Record<BookingStatus, string> = {
      pending_approval: 'Pending Approval',
      approved:         'Confirmed',
      rejected:         'Rejected',
      cancelled:        'Cancelled',
      completed:        'Completed',
      no_show:          'No Show',
    };
    return map[status] ?? status;
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.pendingPage.set(0); this.upcomingPage.set(0); this.pastPage.set(0);
    this.cancelledPage.set(0); this.rejectedPage.set(0);
    const src = this.canSeeAllBookings() && !this.mineOnly()
      ? this.bookingsService.list({})
      : this.bookingsService.myBookings();
    src.subscribe({
      next: (b) => { this.allBookings.set(b); this.loading.set(false); },
      error: (e) => { this.error.set(extractErrorMessage(e)); this.loading.set(false); },
    });
  }

}
