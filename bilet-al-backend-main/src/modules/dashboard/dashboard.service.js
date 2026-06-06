import { dashboard as reportDashboard } from '../reports/report.service.js';
import Showtime from '../showtimes/showtime.model.js';

export async function getAdminDashboard() {
  const base = await reportDashboard();
  const upcomingShowsList = await Showtime.find({ date: { $gte: new Date() } }).sort({ date: 1, startTime: 1 }).limit(8).populate('event hall');
  return { ...base, upcomingShows: base.upcomingShows ?? upcomingShowsList.length, upcomingShowsList };
}
