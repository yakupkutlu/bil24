// ============================================================
// ALL ENTITIES - TypeORM
// ============================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index, Unique
} from 'typeorm';

// ==================== USER ====================

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ type: 'enum', enum: ['customer', 'operator', 'super_admin'], default: 'customer' })
  @Index()
  role: 'customer' | 'operator' | 'super_admin';

  @Column({ type: 'enum', enum: ['active', 'inactive', 'banned'], default: 'active' })
  status: 'active' | 'inactive' | 'banned';

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'preferred_language', type: 'enum', enum: ['tr', 'en'], default: 'tr' })
  preferredLanguage: 'tr' | 'en';

  @Column({ name: 'email_notifications', default: true })
  emailNotifications: boolean;

  @Column({ name: 'sms_notifications', default: false })
  smsNotifications: boolean;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'refresh_token_hash', nullable: true })
  refreshTokenHash: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'email_verification_token', nullable: true })
  emailVerificationToken: string;

  @Column({ name: 'password_reset_token', nullable: true })
  passwordResetToken: string;

  @Column({ name: 'password_reset_expires', nullable: true })
  passwordResetExpires: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// ==================== VENUE ====================

@Entity('venues')
export class Venue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ['cinema', 'table'] })
  @Index()
  type: 'cinema' | 'table';

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ default: 0 })
  capacity: number;

  @Column({ name: 'floor_plan_image_url', nullable: true })
  floorPlanImageUrl: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'cinema_config', type: 'jsonb', nullable: true })
  cinemaConfig: any;

  @Column({ name: 'table_config', type: 'jsonb', nullable: true })
  tableConfig: any;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @OneToMany(() => Seat, (seat) => seat.venue)
  seats: Seat[];

  @OneToMany(() => Session, (session) => session.venue)
  sessions: Session[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// ==================== SEAT ====================

@Entity('seats')
@Unique(['venueId', 'seatCode'])
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'venue_id' })
  venueId: string;

  @ManyToOne(() => Venue, (venue) => venue.seats)
  @JoinColumn({ name: 'venue_id' })
  venue: Venue;

  @Column({ name: 'seat_code' })
  @Index()
  seatCode: string;

  @Column({ name: 'group_letter', nullable: true })
  groupLetter: string;

  @Column({ name: 'row_number', nullable: true })
  rowNumber: number;

  @Column({ name: 'seat_number', nullable: true })
  seatNumber: number;

  @Column({ name: 'table_number', nullable: true })
  tableNumber: string;

  @Column({
    name: 'seat_type',
    type: 'enum',
    enum: ['available', 'occupied', 'reserved', 'vip', 'disabled', 'blocked'],
    default: 'available'
  })
  seatType: string;

  @Column({ name: 'is_vip', default: false })
  isVip: boolean;

  @Column({ name: 'is_disabled_accessible', default: false })
  isDisabledAccessible: boolean;

  @Column({ name: 'x_position', type: 'decimal', nullable: true })
  xPosition: number;

  @Column({ name: 'y_position', type: 'decimal', nullable: true })
  yPosition: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// ==================== EVENT ====================

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ name: 'title_en', nullable: true })
  titleEn: string;

  @Column({ unique: true, nullable: true })
  @Index()
  slug: string;

  @Column({ nullable: true })
  slogan: string;

  @Column({ name: 'slogan_en', nullable: true })
  sloganEn: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn: string;

  @Column({ nullable: true })
  @Index()
  category: string;

  @Column({ name: 'poster_url', nullable: true })
  posterUrl: string;

  @Column({ name: 'cover_image_url', nullable: true })
  coverImageUrl: string;

  @Column({ name: 'gallery_urls', type: 'jsonb', default: '[]' })
  galleryUrls: string[];

  @Column({ name: 'organizer_name', nullable: true })
  organizerName: string;

  @Column({ name: 'organizer_contact', nullable: true })
  organizerContact: string;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @Column({ type: 'enum', enum: ['draft', 'published', 'cancelled', 'completed'], default: 'draft' })
  @Index()
  status: 'draft' | 'published' | 'cancelled' | 'completed';

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'min_age', default: 0 })
  minAge: number;

  @Column({ name: 'duration_minutes', nullable: true })
  durationMinutes: number;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @OneToMany(() => Session, (session) => session.event)
  sessions: Session[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// ==================== SESSION ====================

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, (event) => event.sessions)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ name: 'venue_id' })
  venueId: string;

  @ManyToOne(() => Venue, (venue) => venue.sessions)
  @JoinColumn({ name: 'venue_id' })
  venue: Venue;

  @Column({ name: 'session_date', type: 'date' })
  @Index()
  sessionDate: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime: string;

  @Column({ name: 'duration_minutes', nullable: true })
  durationMinutes: number;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  })
  @Index()
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  basePrice: number;

  @Column({ name: 'vip_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  vipPrice: number;

  @Column({ name: 'student_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  studentPrice: number;

  @Column({ name: 'vat_rate', type: 'decimal', precision: 5, scale: 2, default: 18 })
  vatRate: number;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2, default: 5 })
  commissionRate: number;

  @Column({ name: 'total_capacity', default: 0 })
  totalCapacity: number;

  @Column({ name: 'sold_count', default: 0 })
  soldCount: number;

  @Column({ name: 'reserved_count', default: 0 })
  reservedCount: number;

  @Column({ name: 'seat_selection_enabled', default: true })
  seatSelectionEnabled: boolean;

  @Column({ name: 'max_tickets_per_person', default: 10 })
  maxTicketsPerPerson: number;

  @Column({ name: 'sale_start_at', nullable: true })
  saleStartAt: Date;

  @Column({ name: 'sale_end_at', nullable: true })
  saleEndAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @OneToMany(() => Ticket, (ticket) => ticket.session)
  tickets: Ticket[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// ==================== SESSION SEAT ====================

@Entity('session_seats')
@Unique(['sessionId', 'seatId'])
export class SessionSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @ManyToOne(() => Session)
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @Column({ name: 'seat_id' })
  seatId: string;

  @ManyToOne(() => Seat)
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;

  @Column({
    type: 'enum',
    enum: ['available', 'occupied', 'reserved', 'vip', 'disabled', 'blocked'],
    default: 'available'
  })
  @Index()
  status: string;

  @Column({ name: 'price_category_id', nullable: true })
  priceCategoryId: string;

  @Column({ name: 'ticket_id', nullable: true })
  ticketId: string;

  @Column({ name: 'reserved_at', nullable: true })
  reservedAt: Date;

  @Column({ name: 'reserved_until', nullable: true })
  reservedUntil: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// ==================== PAYMENT ====================

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['credit_card', 'bank_transfer', 'cash', 'mobile_payment']
  })
  @Index()
  method: 'credit_card' | 'bank_transfer' | 'cash' | 'mobile_payment';

  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  })
  @Index()
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'vat_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  vatAmount: number;

  @Column({ name: 'commission_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  commissionAmount: number;

  @Column({ name: 'net_amount', type: 'decimal', precision: 10, scale: 2 })
  netAmount: number;

  @Column({ default: 'TRY' })
  currency: string;

  @Column({ name: 'gateway_transaction_id', nullable: true })
  gatewayTransactionId: string;

  @Column({ name: 'gateway_response', type: 'jsonb', nullable: true })
  gatewayResponse: any;

  @Column({ name: 'operator_id', nullable: true })
  operatorId: string;

  @Column({ name: 'operator_notes', nullable: true })
  operatorNotes: string;

  @Column({ name: 'receipt_number', nullable: true })
  receiptNumber: string;

  @Column({ name: 'refunded_at', nullable: true })
  refundedAt: Date;

  @Column({ name: 'refund_reason', nullable: true })
  refundReason: string;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @OneToMany(() => Ticket, (ticket) => ticket.payment)
  tickets: Ticket[];

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// ==================== TICKET ====================

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_number', unique: true })
  @Index()
  ticketNumber: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @ManyToOne(() => Session, (session) => session.tickets)
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @Column({ name: 'payment_id', nullable: true })
  paymentId: string;

  @ManyToOne(() => Payment, (payment) => payment.tickets, { nullable: true })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({ name: 'owner_user_id', nullable: true })
  ownerUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser: User;

  @Column({ name: 'buyer_first_name', nullable: true })
  buyerFirstName: string;

  @Column({ name: 'buyer_last_name', nullable: true })
  buyerLastName: string;

  @Column({ name: 'buyer_email', nullable: true })
  buyerEmail: string;

  @Column({ name: 'buyer_phone', nullable: true })
  buyerPhone: string;

  @Column({ name: 'seat_id', nullable: true })
  seatId: string;

  @ManyToOne(() => Seat, { nullable: true })
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;

  @Column({ name: 'seat_code', nullable: true })
  seatCode: string;

  @Column({ name: 'seat_label', nullable: true })
  seatLabel: string;

  @Column({ name: 'seat_label_en', nullable: true })
  seatLabelEn: string;

  @Column({ name: 'price_category_id', nullable: true })
  priceCategoryId: string;

  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ name: 'vat_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  vatAmount: number;

  @Column({ name: 'commission_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  commissionAmount: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ name: 'qr_code', type: 'text' })
  @Index()
  qrCode: string;

  @Column({ name: 'qr_type', type: 'enum', enum: ['single_use', 'time_limited'], default: 'single_use' })
  qrType: 'single_use' | 'time_limited';

  @Column({ name: 'qr_expires_at', nullable: true })
  qrExpiresAt: Date;

  @Column({
    type: 'enum',
    enum: ['active', 'used', 'cancelled', 'refunded', 'expired'],
    default: 'active'
  })
  @Index()
  status: 'active' | 'used' | 'cancelled' | 'refunded' | 'expired';

  @Column({ name: 'scanned_at', nullable: true })
  scannedAt: Date;

  @Column({ name: 'scanned_by', nullable: true })
  scannedBy: string;

  @Column({ name: 'scan_count', default: 0 })
  scanCount: number;

  @Column({ name: 'pdf_url', nullable: true })
  pdfUrl: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ name: 'cancelled_at', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'cancelled_by', nullable: true })
  cancelledBy: string;

  @Column({ name: 'cancel_reason', nullable: true })
  cancelReason: string;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @OneToMany(() => TicketScanLog, (log) => log.ticket)
  scanLogs: TicketScanLog[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// ==================== TICKET SCAN LOG ====================

@Entity('ticket_scan_logs')
export class TicketScanLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_id' })
  ticketId: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.scanLogs)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ name: 'scanned_by', nullable: true })
  scannedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'scanned_by' })
  scannedByUser: User;

  @Column({ name: 'scan_result' })
  scanResult: 'success' | 'already_used' | 'invalid' | 'expired';

  @Column({ name: 'scan_notes', nullable: true })
  scanNotes: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'device_info', nullable: true })
  deviceInfo: string;

  @CreateDateColumn({ name: 'scanned_at' })
  @Index()
  scannedAt: Date;
}

// ==================== NOTIFICATION ====================

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'ticket_id', nullable: true })
  ticketId: string;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @Column({ type: 'enum', enum: ['email', 'sms', 'push'] })
  @Index()
  type: 'email' | 'sms' | 'push';

  @Column({ type: 'enum', enum: ['pending', 'sent', 'failed'], default: 'pending' })
  @Index()
  status: 'pending' | 'sent' | 'failed';

  @Column({ nullable: true })
  subject: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column()
  recipient: string;

  @Column({ name: 'sent_at', nullable: true })
  sentAt: Date;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// ==================== AUDIT LOG ====================

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  action: string;

  @Column({ name: 'entity_type', nullable: true })
  @Index()
  entityType: string;

  @Column({ name: 'entity_id', nullable: true })
  entityId: string;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues: any;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: any;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}
