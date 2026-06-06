import dayjs from 'dayjs';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../modules/users/user.model.js';
import Event from '../modules/events/event.model.js';
import Hall from '../modules/halls/hall.model.js';
import Showtime from '../modules/showtimes/showtime.model.js';
import Booking from '../modules/bookings/booking.model.js';
import Ticket from '../modules/tickets/ticket.model.js';
import Payment from '../modules/payments/payment.model.js';
import Refund from '../modules/refunds/refund.model.js';
import Notification from '../modules/notifications/notification.model.js';
import AuditLog from '../modules/auditLogs/auditLog.model.js';
import SystemSettings from '../modules/settings/systemSettings.model.js';
import { hashPassword } from '../utils/password.js';
import { makeSlug } from '../utils/slug.js';
import { createQrImage } from '../utils/qr.js';
import {
  BOOKING_SOURCE,
  BOOKING_STATUS,
  EVENT_STATUS,
  HALL_STATUS,
  NOTIFICATION_STATUS,
  PAYMENT_METHOD,
  PAYMENT_PROVIDER,
  PAYMENT_STATUS,
  REFUND_STATUS,
  ROLES,
  SHOWTIME_STATUS,
  TICKET_STATUS,
  USER_STATUS
} from '../utils/constants.js';
import { generateSeatMap } from '../modules/halls/hall.service.js';

// Demo posters use stable remote Unsplash image URLs.
// This avoids broken localhost upload paths when the frontend runs on a different port.
// You can still upload your own posters later from the admin panel.
function unsplashPhoto(photoId, width = 900, height = 1300) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&crop=entropy&w=${width}&h=${height}&q=80`;
}

const internetEventImages = {
  'kirmizi-perde': {
    poster: unsplashPhoto('photo-1503095396549-807759245b35'),
    gallery: [
      unsplashPhoto('photo-1514306191717-452ec28c7814', 1600, 900),
      unsplashPhoto('photo-1568407645630-fc5e8a90f12e', 1600, 900)
    ]
  },
  'bir-yaz-gecesi-ruyasi': {
    poster: unsplashPhoto('photo-1576724196706-3f23f51ea351'),
    gallery: [
      unsplashPhoto('photo-1576724196706-3f23f51ea351', 1600, 900),
      unsplashPhoto('photo-1579539760267-b2e78d9d735e', 1600, 900)
    ]
  },
  'anadolu-masallari': {
    poster: unsplashPhoto('photo-1579539760267-b2e78d9d735e'),
    gallery: [
      unsplashPhoto('photo-1579539760267-b2e78d9d735e', 1600, 900),
      unsplashPhoto('photo-1615414015111-8d98cb65677e', 1600, 900)
    ]
  },
  'siyah-kutu': {
    poster: unsplashPhoto('photo-1545129139-1beb780cf337'),
    gallery: [
      unsplashPhoto('photo-1545129139-1beb780cf337', 1600, 900),
      unsplashPhoto('photo-1613210434051-4b00d62d03fb', 1600, 900)
    ]
  },
  'komedi-gecesi': {
    poster: unsplashPhoto('photo-1611956425642-d5a8169abd63'),
    gallery: [
      unsplashPhoto('photo-1611956425642-d5a8169abd63', 1600, 900),
      unsplashPhoto('photo-1580188928585-0ef5c1a5c4dd', 1600, 900)
    ]
  },
  'kapali-prova': {
    poster: unsplashPhoto('photo-1618861297248-3438b3d9aae9'),
    gallery: [
      unsplashPhoto('photo-1618861297248-3438b3d9aae9', 1600, 900),
      unsplashPhoto('photo-1514306191717-452ec28c7814', 1600, 900)
    ]
  }
};

function eventImages(slug) {
  return internetEventImages[slug] || internetEventImages['kirmizi-perde'];
}

const PASSWORD = 'Password123';

const demoUsers = [
  { fullName: 'Tiatru Super Admin', email: 'superadmin@tiatru.com', phone: '+905550000001', role: ROLES.SUPER_ADMIN },
  { fullName: 'Tiatru Admin', email: 'admin@tiatru.com', phone: '+905550000002', role: ROLES.ADMIN },
  { fullName: 'Tiatru Event Manager', email: 'manager@tiatru.com', phone: '+905550000003', role: ROLES.EVENT_MANAGER },
  { fullName: 'Tiatru Finance', email: 'finance@tiatru.com', phone: '+905550000004', role: ROLES.FINANCE },
  { fullName: 'Tiatru Box Office', email: 'staff@tiatru.com', phone: '+905550000005', role: ROLES.BOX_OFFICE },
  { fullName: 'Tiatru Customer', email: 'customer@tiatru.com', phone: '+905550000006', role: ROLES.CUSTOMER },
  { fullName: 'Elif Kaya', email: 'elif.customer@tiatru.com', phone: '+905550000007', role: ROLES.CUSTOMER },
  { fullName: 'Ahmet Demir', email: 'ahmet.customer@tiatru.com', phone: '+905550000008', role: ROLES.CUSTOMER }
];

const demoEvents = [
  {
    title: 'Kırmızı Perde',
    category: 'Drama',
    language: 'tr',
    durationMinutes: 95,
    ageLimit: 16,
    director: 'Murat Ersoy',
    shortDescription: 'Geçmiş, aile ve affetme üzerine sinematik bir sahne hikayesi.',
    description: 'Kırmızı Perde, güçlü oyunculuklar ve yoğun sahne atmosferiyle geçmişin izlerini, aile bağlarını ve yeniden başlamanın cesaretini anlatan modern bir tiyatro oyunudur.',
    cast: [
      { name: 'Ayşe Yılmaz', role: 'Leyla' },
      { name: 'Can Arslan', role: 'Kerem' },
      { name: 'Zeynep Aksoy', role: 'Nermin' }
    ],
    status: EVENT_STATUS.PUBLISHED
  },
  {
    title: 'Bir Yaz Gecesi Rüyası',
    category: 'Comedy',
    language: 'tr',
    durationMinutes: 125,
    ageLimit: 12,
    director: 'Tiatru Ensemble',
    shortDescription: 'Aşk, büyü ve yanlış anlaşılmalarla dolu büyülü bir gece.',
    description: 'Shakespeare esintili bu uyarlama, canlı müzik, zarif kostümler ve sıcak komedi diliyle seyirciyi masalsı bir atmosfere davet eder.',
    cast: [
      { name: 'Deniz Kaya', role: 'Oberon' },
      { name: 'Elif Demir', role: 'Titania' },
      { name: 'Berk Şahin', role: 'Puck' }
    ],
    status: EVENT_STATUS.PUBLISHED
  },
  {
    title: 'Anadolu Masalları',
    category: 'Family',
    language: 'tr',
    durationMinutes: 80,
    ageLimit: 7,
    director: 'Selin Aydın',
    shortDescription: 'Aileler için renkli, müzikli ve sıcak bir masal yolculuğu.',
    description: 'Anadolu Masalları, geleneksel hikayeleri modern sahne diliyle buluşturan, çocuklar ve aileler için tasarlanmış duygusal ve eğlenceli bir oyundur.',
    cast: [
      { name: 'Mina Güneş', role: 'Anlatıcı' },
      { name: 'Ozan Tekin', role: 'Keloğlan' },
      { name: 'Ece Uçar', role: 'Bilge Kadın' }
    ],
    status: EVENT_STATUS.PUBLISHED
  },
  {
    title: 'Siyah Kutu',
    category: 'Thriller',
    language: 'tr',
    durationMinutes: 105,
    ageLimit: 16,
    director: 'Koray Altun',
    shortDescription: 'Tek mekanda geçen gerilim dolu psikolojik bir oyun.',
    description: 'Siyah Kutu, seyirciyi suç, hafıza ve gerçeklik arasında gidip gelen karanlık bir sorguya davet eden modern bir gerilim oyunudur.',
    cast: [
      { name: 'Emre Kurt', role: 'Komiser' },
      { name: 'Derya Sönmez', role: 'Tanık' }
    ],
    status: EVENT_STATUS.PUBLISHED
  },
  {
    title: 'Komedi Gecesi',
    category: 'Comedy',
    language: 'tr',
    durationMinutes: 75,
    ageLimit: 13,
    director: 'Tiatru Comedy Lab',
    shortDescription: 'Hızlı skeçler, doğaçlama ve bol kahkaha.',
    description: 'Komedi Gecesi, güncel hayatın küçük krizlerini sahneye taşıyan, enerjik ve seyirciyle etkileşimli bir performans gecesidir.',
    cast: [
      { name: 'Burak Can', role: 'Komedyen' },
      { name: 'Melis Koç', role: 'Komedyen' },
      { name: 'Eren Öz', role: 'Müzisyen' }
    ],
    status: EVENT_STATUS.PUBLISHED
  },
  {
    title: 'Kapalı Prova',
    category: 'Drama',
    language: 'tr',
    durationMinutes: 90,
    ageLimit: 14,
    director: 'Nil Karaca',
    shortDescription: 'Yayına alınmadan önce test edilen özel bir taslak oyun.',
    description: 'Kapalı Prova, yönetim panelindeki taslak ve yayın akışını test etmek için oluşturulmuş demo bir etkinliktir.',
    cast: [{ name: 'Tiatru Oyuncuları', role: 'Ensemble' }],
    status: EVENT_STATUS.DRAFT
  }
];

function addCustomSeats(seatMap, changes = {}) {
  return seatMap.map((seat) => ({
    ...seat,
    isAccessible: changes.accessible?.includes(seat.code) || seat.isAccessible,
    isBlocked: changes.blocked?.includes(seat.code) || seat.isBlocked,
    category: changes.vip?.includes(seat.code) ? 'VIP' : changes.student?.includes(seat.code) ? 'STUDENT' : seat.category
  }));
}

async function seedUsers() {
  const passwordHash = await hashPassword(PASSWORD);
  const result = {};
  for (const user of demoUsers) {
    const doc = await User.findOneAndUpdate(
      { email: user.email },
      {
        ...user,
        passwordHash,
        isEmailVerified: true,
        isPhoneVerified: true,
        status: USER_STATUS.ACTIVE,
        preferences: {
          language: 'tr',
          favoriteCategories: user.role === ROLES.CUSTOMER ? ['Drama', 'Comedy'] : [],
          emailNotifications: true,
          smsNotifications: user.role === ROLES.CUSTOMER,
          marketingPermission: user.role === ROLES.CUSTOMER
        },
        birthDate: user.role === ROLES.CUSTOMER ? dayjs('1998-04-12').toDate() : undefined
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    result[user.email] = doc;
  }
  return result;
}

async function seedSettings(admin) {
  return SystemSettings.findOneAndUpdate(
    { singletonKey: 'default' },
    {
      websiteName: 'Tiatru',
      logo: eventImages('kirmizi-perde').poster,
      theme: { primaryColor: '#7A0C0C', accentColor: '#B8860B', mode: 'dark' },
      paymentSettings: { defaultProvider: 'MOCK', currency: 'TRY', iyzicoEnabled: false, cashEnabled: true },
      emailSettings: { enabled: false, senderName: 'Tiatru' },
      smsSettings: { enabled: false, provider: '' },
      ticketRules: { seatHoldMinutes: 10, cancellationDeadlineHours: 24, refundAllowed: true, serviceFee: 25, taxRate: 0.2 },
      maintenanceMode: false,
      updatedBy: admin._id
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function seedHalls() {
  const mainSeatMap = addCustomSeats(generateSeatMap(8, 12), {
    accessible: ['H1', 'H2', 'H11', 'H12'],
    blocked: ['D6', 'D7'],
    vip: ['A1', 'A2', 'A3', 'A10', 'A11', 'A12']
  });

  const studioSeatMap = addCustomSeats(generateSeatMap(6, 10), {
    accessible: ['F1', 'F10'],
    blocked: ['C5'],
    vip: ['A1', 'A2', 'A9', 'A10']
  });

  const ana = await Hall.findOneAndUpdate(
    { name: 'Ana Sahne' },
    {
      name: 'Ana Sahne',
      description: 'Kırmızı perde atmosferine sahip büyük salon. Gala, drama ve büyük prodüksiyonlar için uygundur.',
      rows: 8,
      seatsPerRow: 12,
      capacity: mainSeatMap.length,
      seatMap: mainSeatMap,
      status: HALL_STATUS.ACTIVE
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const studio = await Hall.findOneAndUpdate(
    { name: 'Studio Sahne' },
    {
      name: 'Studio Sahne',
      description: 'Daha yakın, samimi ve deneysel oyunlar için küçük sahne.',
      rows: 6,
      seatsPerRow: 10,
      capacity: studioSeatMap.length,
      seatMap: studioSeatMap,
      status: HALL_STATUS.ACTIVE
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return { ana, studio };
}

async function seedEvents(users) {
  const result = {};
  const admin = users['superadmin@tiatru.com'];
  for (const event of demoEvents) {
    const slug = makeSlug(event.title);
    const doc = await Event.findOneAndUpdate(
      { slug },
      {
        ...event,
        slug,
        posterImage: eventImages(slug).poster,
        gallery: eventImages(slug).gallery,
        trailerUrl: '',
        createdBy: admin._id,
        updatedBy: admin._id,
        seo: {
          title: `${event.title} | Tiatru`,
          description: event.shortDescription,
          keywords: [event.category, 'tiyatru', 'tiyatro', 'bilet']
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    result[slug] = doc;
  }
  return result;
}

async function seedShowtimes(events, halls) {
  const base = dayjs().add(4, 'day').hour(20).minute(0).second(0).millisecond(0);
  const plans = [
    ['kirmizi-perde', halls.ana, 0, '20:30', '22:05', SHOWTIME_STATUS.ON_SALE, { VIP: 650, STANDARD: 420, STUDENT: 280 }],
    ['kirmizi-perde', halls.ana, 2, '20:30', '22:05', SHOWTIME_STATUS.ON_SALE, { VIP: 650, STANDARD: 420, STUDENT: 280 }],
    ['bir-yaz-gecesi-ruyasi', halls.ana, 1, '19:30', '21:35', SHOWTIME_STATUS.ON_SALE, { VIP: 600, STANDARD: 390, STUDENT: 250 }],
    ['bir-yaz-gecesi-ruyasi', halls.studio, 5, '18:00', '20:05', SHOWTIME_STATUS.SCHEDULED, { VIP: 520, STANDARD: 330, STUDENT: 220 }],
    ['anadolu-masallari', halls.studio, 3, '14:00', '15:20', SHOWTIME_STATUS.ON_SALE, { VIP: 380, STANDARD: 260, STUDENT: 190 }],
    ['siyah-kutu', halls.studio, 4, '21:00', '22:45', SHOWTIME_STATUS.ON_SALE, { VIP: 560, STANDARD: 360, STUDENT: 240 }],
    ['komedi-gecesi', halls.ana, 6, '21:15', '22:30', SHOWTIME_STATUS.ON_SALE, { VIP: 500, STANDARD: 320, STUDENT: 230 }],
    ['kapali-prova', halls.studio, 9, '18:30', '20:00', SHOWTIME_STATUS.SCHEDULED, { VIP: 300, STANDARD: 200, STUDENT: 150 }]
  ];

  const result = {};
  for (const [slug, hall, offset, startTime, endTime, status, pricing] of plans) {
    const event = events[slug];
    const [hour, minute] = startTime.split(':').map(Number);
    const date = base.add(offset, 'day').hour(hour).minute(minute).toDate();
    const doc = await Showtime.findOneAndUpdate(
      { event: event._id, hall: hall._id, date, startTime },
      {
        event: event._id,
        hall: hall._id,
        date,
        startTime,
        endTime,
        status,
        pricing,
        availableFrom: dayjs().subtract(1, 'day').toDate(),
        availableUntil: dayjs(date).subtract(2, 'hour').toDate(),
        cancellationPolicy: 'İade talepleri etkinlik saatinden 24 saat öncesine kadar yapılabilir.'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    result[`${slug}-${offset}`] = doc;
  }
  return result;
}

function priceForSeat(showtime, seat) {
  return showtime.pricing?.[seat.category] ?? showtime.pricing?.STANDARD ?? 0;
}

async function upsertPayment({ paymentNumber, booking, status, method = PAYMENT_METHOD.CARD, provider = PAYMENT_PROVIDER.MOCK, amount, transactionSuffix }) {
  return Payment.findOneAndUpdate(
    { paymentNumber },
    {
      paymentNumber,
      booking: booking._id,
      user: booking.user,
      provider,
      method,
      amount,
      currency: 'TRY',
      status,
      providerTransactionId: status === PAYMENT_STATUS.SUCCESS || status === PAYMENT_STATUS.REFUNDED ? `DEMO-TXN-${transactionSuffix}` : '',
      providerResponse: { demo: true, source: 'seed-demo-data' },
      paidAt: status === PAYMENT_STATUS.SUCCESS || status === PAYMENT_STATUS.REFUNDED ? new Date() : undefined
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertTicket({ ticketNumber, booking, showtime, seat, status = TICKET_STATUS.VALID, usedBy }) {
  const qrToken = `demo-${ticketNumber}`;
  return Ticket.findOneAndUpdate(
    { ticketNumber },
    {
      ticketNumber,
      booking: booking._id,
      user: booking.user,
      event: showtime.event,
      showtime: showtime._id,
      hall: showtime.hall,
      seatCode: seat.seatCode,
      category: seat.category,
      price: seat.price,
      qrToken,
      qrImage: await createQrImage(qrToken),
      status,
      usedAt: status === TICKET_STATUS.USED ? dayjs().subtract(1, 'hour').toDate() : undefined,
      usedBy: status === TICKET_STATUS.USED && usedBy ? usedBy._id : undefined
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertBookingPackage({
  bookingNumber,
  customer,
  showtime,
  hall,
  seatCodes,
  status,
  source = BOOKING_SOURCE.ONLINE,
  createdBy,
  paymentStatus,
  paymentMethod = PAYMENT_METHOD.CARD,
  ticketStatus = TICKET_STATUS.VALID,
  usedBy
}) {
  const hallSeatMap = hall.seatMap || [];
  const seats = seatCodes.map((code) => {
    const seat = hallSeatMap.find((item) => item.code === code);
    const category = seat?.category || 'STANDARD';
    return { seatCode: code, category, price: priceForSeat(showtime, { category }) };
  });

  const subtotal = seats.reduce((sum, seat) => sum + seat.price, 0);
  const serviceFee = status === BOOKING_STATUS.PAID || status === BOOKING_STATUS.RESERVED ? 25 : 0;
  const tax = Math.round(subtotal * 0.2 * 100) / 100;
  const total = Math.max(0, subtotal + serviceFee + tax);

  const booking = await Booking.findOneAndUpdate(
    { bookingNumber },
    {
      bookingNumber,
      user: customer._id,
      showtime: showtime._id,
      seats,
      status,
      subtotal,
      serviceFee,
      discount: 0,
      tax,
      total,
      expiresAt: status === BOOKING_STATUS.RESERVED ? dayjs().add(9, 'minute').toDate() : undefined,
      source,
      createdBy: createdBy?._id,
      customerSnapshot: { fullName: customer.fullName, email: customer.email, phone: customer.phone }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  let payment = null;
  let tickets = [];
  if ([BOOKING_STATUS.PAID, BOOKING_STATUS.REFUNDED].includes(status)) {
    payment = await upsertPayment({
      paymentNumber: bookingNumber.replace('BKG', 'PAY'),
      booking,
      status: paymentStatus || (status === BOOKING_STATUS.REFUNDED ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.SUCCESS),
      method: source === BOOKING_SOURCE.BOX_OFFICE ? PAYMENT_METHOD.CASH : paymentMethod,
      provider: source === BOOKING_SOURCE.BOX_OFFICE ? PAYMENT_PROVIDER.CASH : PAYMENT_PROVIDER.MOCK,
      amount: total,
      transactionSuffix: bookingNumber
    });
    booking.payment = payment._id;
    await booking.save();

    for (let i = 0; i < seats.length; i += 1) {
      const seededTicket = await upsertTicket({
        ticketNumber: bookingNumber.replace('BKG', `TKT-${i + 1}`),
        booking,
        showtime,
        seat: seats[i],
        status: status === BOOKING_STATUS.REFUNDED ? TICKET_STATUS.REFUNDED : ticketStatus,
        usedBy
      });
      tickets.push(seededTicket);
    }
    booking.tickets = tickets.map((ticket) => ticket._id);
    await booking.save();
  }

  return { booking, payment, tickets };
}

async function seedBookings(users, showtimes, halls) {
  const staff = users['staff@tiatru.com'];
  const customer = users['customer@tiatru.com'];
  const elif = users['elif.customer@tiatru.com'];
  const ahmet = users['ahmet.customer@tiatru.com'];

  const stKirmizi = showtimes['kirmizi-perde-0'];
  const stRuyasi = showtimes['bir-yaz-gecesi-ruyasi-1'];
  const stMasal = showtimes['anadolu-masallari-3'];
  const stSiyah = showtimes['siyah-kutu-4'];
  const stComedy = showtimes['komedi-gecesi-6'];

  const packages = [];
  packages.push(await upsertBookingPackage({ bookingNumber: 'BKG-DEMO-1001', customer, showtime: stKirmizi, hall: halls.ana, seatCodes: ['A1', 'A2'], status: BOOKING_STATUS.PAID, source: BOOKING_SOURCE.ONLINE }));
  packages.push(await upsertBookingPackage({ bookingNumber: 'BKG-DEMO-1002', customer: elif, showtime: stRuyasi, hall: halls.ana, seatCodes: ['B5'], status: BOOKING_STATUS.PAID, source: BOOKING_SOURCE.BOX_OFFICE, createdBy: staff, ticketStatus: TICKET_STATUS.USED, usedBy: staff }));
  packages.push(await upsertBookingPackage({ bookingNumber: 'BKG-DEMO-1003', customer: ahmet, showtime: stMasal, hall: halls.studio, seatCodes: ['C3', 'C4', 'C6'], status: BOOKING_STATUS.RESERVED, source: BOOKING_SOURCE.ONLINE }));
  packages.push(await upsertBookingPackage({ bookingNumber: 'BKG-DEMO-1004', customer: elif, showtime: stSiyah, hall: halls.studio, seatCodes: ['A1'], status: BOOKING_STATUS.REFUNDED, source: BOOKING_SOURCE.ONLINE }));
  packages.push(await upsertBookingPackage({ bookingNumber: 'BKG-DEMO-1005', customer: ahmet, showtime: stComedy, hall: halls.ana, seatCodes: ['D8', 'D9'], status: BOOKING_STATUS.CANCELLED, source: BOOKING_SOURCE.ONLINE }));

  return packages;
}

async function seedRefunds(packages, users) {
  const refunded = packages.find((item) => item.booking.bookingNumber === 'BKG-DEMO-1004');
  if (!refunded?.payment) return [];
  const refund = await Refund.findOneAndUpdate(
    { refundNumber: 'REF-DEMO-1004' },
    {
      refundNumber: 'REF-DEMO-1004',
      booking: refunded.booking._id,
      payment: refunded.payment._id,
      user: refunded.booking.user,
      amount: refunded.booking.total,
      reason: 'Etkinlik tarihinden önce müşteri talebiyle iade edildi.',
      status: REFUND_STATUS.REFUNDED,
      requestedBy: refunded.booking.user,
      approvedBy: users['finance@tiatru.com']._id,
      processedAt: dayjs().subtract(1, 'day').toDate()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return [refund];
}

async function seedNotifications(users, packages) {
  const customer = users['customer@tiatru.com'];
  const staff = users['staff@tiatru.com'];
  const booking = packages[0]?.booking;
  const notifications = [
    {
      user: customer._id,
      type: 'SYSTEM',
      title: 'Biletiniz hazır',
      message: 'Kırmızı Perde için QR biletiniz oluşturuldu. Salona girişte QR kodunuzu gösterebilirsiniz.',
      channel: 'in_app',
      status: NOTIFICATION_STATUS.SENT,
      relatedEntity: booking ? { module: 'bookings', id: booking._id } : undefined,
      sentAt: new Date()
    },
    {
      user: staff._id,
      type: 'SYSTEM',
      title: 'Gişe vardiyası başladı',
      message: 'Bugünkü seanslar için QR doğrulama ve manuel satış ekranları hazır.',
      channel: 'in_app',
      status: NOTIFICATION_STATUS.SENT,
      sentAt: new Date()
    }
  ];
  const docs = [];
  for (const item of notifications) {
    docs.push(await Notification.findOneAndUpdate(
      { user: item.user, title: item.title },
      item,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ));
  }
  return docs;
}

async function seedAuditLogs(users, events, halls) {
  const admin = users['superadmin@tiatru.com'];
  const logs = [
    { actor: admin._id, action: 'DEMO_SEED_EVENTS', module: 'events', entityId: events['kirmizi-perde']._id, newValue: { title: 'Kırmızı Perde' }, ipAddress: '127.0.0.1', userAgent: 'seed-demo-data' },
    { actor: admin._id, action: 'DEMO_SEED_HALLS', module: 'halls', entityId: halls.ana._id, newValue: { name: 'Ana Sahne' }, ipAddress: '127.0.0.1', userAgent: 'seed-demo-data' },
    { actor: admin._id, action: 'DEMO_SEED_SETTINGS', module: 'settings', newValue: { websiteName: 'Tiatru' }, ipAddress: '127.0.0.1', userAgent: 'seed-demo-data' }
  ];
  const docs = [];
  for (const log of logs) {
    docs.push(await AuditLog.findOneAndUpdate(
      { action: log.action, module: log.module, entityId: log.entityId },
      log,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ));
  }
  return docs;
}

async function safeResetDemoData() {
  if (process.env.TIATRU_DEMO_RESET !== 'true') return;
  const demoEmails = demoUsers.map((user) => user.email);
  const demoSlugs = demoEvents.map((event) => makeSlug(event.title));
  const demoEventsDocs = await Event.find({ slug: { $in: demoSlugs } }).select('_id');
  const eventIds = demoEventsDocs.map((event) => event._id);
  const demoHalls = await Hall.find({ name: { $in: ['Ana Sahne', 'Studio Sahne'] } }).select('_id');
  const hallIds = demoHalls.map((hall) => hall._id);
  const demoBookings = await Booking.find({ bookingNumber: /^BKG-DEMO-/ }).select('_id');
  const bookingIds = demoBookings.map((booking) => booking._id);

  await Promise.all([
    Refund.deleteMany({ refundNumber: /^REF-DEMO-/ }),
    Payment.deleteMany({ paymentNumber: /^PAY-DEMO-/ }),
    Ticket.deleteMany({ ticketNumber: /^TKT-\d-DEMO-/ }),
    Booking.deleteMany({ bookingNumber: /^BKG-DEMO-/ }),
    Notification.deleteMany({ title: { $in: ['Biletiniz hazır', 'Gişe vardiyası başladı'] } }),
    AuditLog.deleteMany({ action: /^DEMO_SEED_/ }),
    Showtime.deleteMany({ $or: [{ event: { $in: eventIds } }, { hall: { $in: hallIds } }] }),
    Event.deleteMany({ slug: { $in: demoSlugs } }),
    Hall.deleteMany({ name: { $in: ['Ana Sahne', 'Studio Sahne'] } }),
    User.deleteMany({ email: { $in: demoEmails }, role: { $ne: ROLES.SUPER_ADMIN } })
  ]);

  if (bookingIds.length) {
    await Promise.all([
      Payment.deleteMany({ booking: { $in: bookingIds } }),
      Ticket.deleteMany({ booking: { $in: bookingIds } }),
      Refund.deleteMany({ booking: { $in: bookingIds } })
    ]);
  }
}

async function main() {
  await connectDB();
  await safeResetDemoData();
  const users = await seedUsers();
  await seedSettings(users['superadmin@tiatru.com']);
  const halls = await seedHalls();
  const events = await seedEvents(users);
  const showtimes = await seedShowtimes(events, halls);
  const packages = await seedBookings(users, showtimes, halls);
  await seedRefunds(packages, users);
  await seedNotifications(users, packages);
  await seedAuditLogs(users, events, halls);

  console.log('✅ Tiatru demo data seeded successfully');
  console.table(demoUsers.map((user) => ({ email: user.email, password: PASSWORD, role: user.role })));
  console.log(`🎭 Events: ${Object.keys(events).length}`);
  console.log(`🏛️ Halls: ${Object.keys(halls).length}`);
  console.log(`🕒 Showtimes: ${Object.keys(showtimes).length}`);
  console.log(`🧾 Demo bookings: ${packages.length}`);
  console.log('📌 Demo QR token example: demo-TKT-1-DEMO-1001');
  console.log('🖼️ Event posters use remote Unsplash photo URLs');

  await disconnectDB();
}

main().catch(async (error) => {
  console.error('❌ Demo seed failed:', error);
  await disconnectDB();
  process.exit(1);
});