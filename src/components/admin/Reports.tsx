import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Calendar } from 'lucide-react';
import { ticketsApi, hallsApi, eventsApi } from '../../lib/api';

interface ReportData {
  totalTicketsSold: number;
  totalRevenue: number;
  averageTicketPrice: number;
  dailySalesData: Array<{ date: string; sales: number; revenue: number }>;
  paymentMethodData: Array<{ name: string; value: number }>;
  hallOccupancyData: Array<{ hall: string; percentage: number }>;
  topEventsData: Array<{ event: string; tickets: number }>;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function Reports() {
  const [data, setData] = useState<ReportData>({
    totalTicketsSold: 0,
    totalRevenue: 0,
    averageTicketPrice: 0,
    dailySalesData: [],
    paymentMethodData: [],
    hallOccupancyData: [],
    topEventsData: [],
  });

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  async function fetchReportData() {
    setLoading(true);
    try {
      const [tickets, hallsData, eventsData] = await Promise.all([
        ticketsApi.list({ start_date: dateRange.startDate, end_date: dateRange.endDate }),
        hallsApi.list(),
        eventsApi.list(true),
      ]);

      // PostgreSQL numeric alanlar string olarak gelir, Number() ile dönüştür
      type TicketRow = {
        price?: string | number;
        created_at: string;
        payment_method?: string;
        session?: { hall?: { id: string; name: string }; event?: { id: string; title: string } };
      };

      const totalTicketsSold = tickets.length;
      const totalRevenue = (tickets as TicketRow[]).reduce(
        (sum, t) => sum + (Number(t.price) || 0), 0
      );
      const averageTicketPrice = totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0;

      const dailyMap = new Map<string, { sales: number; revenue: number }>();
      (tickets as TicketRow[]).forEach((ticket) => {
        const date = new Date(ticket.created_at).toLocaleDateString('tr-TR');
        const current = dailyMap.get(date) || { sales: 0, revenue: 0 };
        dailyMap.set(date, {
          sales: current.sales + 1,
          revenue: current.revenue + (Number(ticket.price) || 0),
        });
      });

      const dailySalesData = Array.from(dailyMap.entries())
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([date, d]) => ({ date, sales: d.sales, revenue: d.revenue }));

      const paymentMethodMap = new Map<string, number>();
      (tickets as TicketRow[]).forEach((ticket) => {
        const method = ticket.payment_method || 'Tanımsız';
        paymentMethodMap.set(method, (paymentMethodMap.get(method) || 0) + 1);
      });

      const paymentMethodData = Array.from(paymentMethodMap.entries()).map(
        ([name, value]) => ({ name: translatePaymentMethod(name), value })
      );

      // Salon doluluk oranı: biletlerdeki session.hall üzerinden hesaplanır
      const hallOccupancyMap = new Map<string, { name: string; count: number; capacity: number }>();
      (hallsData as { id: string; name: string; total_capacity: number }[]).forEach((hall) => {
        hallOccupancyMap.set(hall.id, { name: hall.name, count: 0, capacity: hall.total_capacity || 1 });
      });

      (tickets as TicketRow[]).forEach((ticket) => {
        const hallId = ticket.session?.hall?.id;
        if (hallId && hallOccupancyMap.has(hallId)) {
          hallOccupancyMap.get(hallId)!.count += 1;
        }
      });

      const hallOccupancyData = Array.from(hallOccupancyMap.values())
        .map((hall) => ({
          hall: hall.name,
          percentage: Math.round((hall.count / hall.capacity) * 100),
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5);

      // En çok satılan etkinlikler: session.event.title üzerinden hesaplanır
      const eventMap = new Map<string, number>();
      (tickets as TicketRow[]).forEach((ticket) => {
        const eventName = ticket.session?.event?.title || 'Bilinmiyor';
        eventMap.set(eventName, (eventMap.get(eventName) || 0) + 1);
      });

      const topEventsData = Array.from(eventMap.entries())
        .map(([event, tickets]) => ({ event, tickets }))
        .sort((a, b) => b.tickets - a.tickets)
        .slice(0, 5);

      setData({
        totalTicketsSold,
        totalRevenue,
        averageTicketPrice,
        dailySalesData:
          dailySalesData.length > 0
            ? dailySalesData
            : [{ date: 'Veri Yok', sales: 0, revenue: 0 }],
        paymentMethodData:
          paymentMethodData.length > 0
            ? paymentMethodData
            : [{ name: 'Veri Yok', value: 0 }],
        hallOccupancyData:
          hallOccupancyData.length > 0
            ? hallOccupancyData
            : [{ hall: 'Veri Yok', percentage: 0 }],
        topEventsData:
          topEventsData.length > 0
            ? topEventsData
            : [{ event: 'Veri Yok', tickets: 0 }],
      });
    } catch (error) {
      console.error('Rapor verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }

  function translatePaymentMethod(method: string): string {
    const translations: Record<string, string> = {
      credit_card: 'Kredi Kartı',
      debit_card: 'Banka Kartı',
      bank_transfer: 'Havale',
      wallet: 'E-Cüzdan',
      cash: 'Nakit',
      undefined: 'Tanımsız',
    };
    return translations[method] || method;
  }

  const StatCard = ({
    title,
    value,
    unit,
  }: {
    title: string;
    value: number | string;
    unit?: string;
  }) => (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {title}
      </p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
        {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
        {unit && <span className="text-lg font-normal ml-2">{unit}</span>}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600 dark:text-gray-400">
          Rapor verileri yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Raporlar & Analitikler
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Bilet satışları ve gelir analizi
        </p>
      </div>

      {/* Date Filter */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Başlangıç Tarihi
          </label>
          <div className="relative">
            <Calendar
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Bitiş Tarihi
          </label>
          <div className="relative">
            <Calendar
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Toplam Satılan Bilet" value={data.totalTicketsSold} />
        <StatCard
          title="Toplam Gelir"
          value={data.totalRevenue.toFixed(2)}
          unit="₺"
        />
        <StatCard
          title="Ortalama Bilet Fiyatı"
          value={data.averageTicketPrice.toFixed(2)}
          unit="₺"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Son 30 Günlük Günlük Satışlar
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.dailySalesData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                className="dark:stroke-gray-700"
              />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                className="dark:stroke-gray-600"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="#9ca3af"
                className="dark:stroke-gray-600"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Bar dataKey="sales" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Method Pie Chart */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ödeme Yöntemine Göre Satışlar
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.paymentMethodData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} (${value})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.paymentMethodData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Hall Occupancy Chart */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Mekan Doluluğu (%)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.hallOccupancyData} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                className="dark:stroke-gray-700"
              />
              <XAxis
                type="number"
                stroke="#9ca3af"
                className="dark:stroke-gray-600"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                dataKey="hall"
                type="category"
                stroke="#9ca3af"
                className="dark:stroke-gray-600"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Bar
                dataKey="percentage"
                fill="#10b981"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Events Chart */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            En Çok Satılan Etkinlikler
          </h2>
          <div className="space-y-3">
            {data.topEventsData.map((event, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {event.event}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <div className="w-32 h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{
                        width: `${
                          (event.tickets /
                            Math.max(
                              ...data.topEventsData.map((e) => e.tickets)
                            )) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">
                    {event.tickets}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
