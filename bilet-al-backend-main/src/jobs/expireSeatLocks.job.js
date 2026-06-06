import { connectDB, disconnectDB } from '../config/db.js';
import { expireOldLocks } from '../modules/seats/seat.service.js';
import { expireOldBookings } from '../modules/bookings/booking.service.js';

await connectDB();
const locks = await expireOldLocks();
const bookings = await expireOldBookings();
console.log({ locks, bookings });
await disconnectDB();
