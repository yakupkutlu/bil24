export type Role = 'CUSTOMER' | 'BOX_OFFICE' | 'EVENT_MANAGER' | 'FINANCE' | 'ADMIN' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'DELETED';
export type SeatStatus = 'AVAILABLE' | 'SELECTED' | 'HELD' | 'SOLD' | 'DISABLED';
export type SeatCategory = 'VIP' | 'STANDARD' | 'STUDENT';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'CANCELLED';
export type ShowtimeStatus = 'SCHEDULED' | 'ON_SALE' | 'SOLD_OUT' | 'CANCELLED' | 'COMPLETED';
export type BookingStatus = 'PENDING' | 'RESERVED' | 'PAID' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED' | 'REFUNDED' | 'EXPIRED' | 'NOT_FOUND';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'REFUNDED' | 'FAILED';
export interface ApiResponse<T>{success:boolean;message?:string;data:T}
export interface PaginatedResponse<T>{data:T[];page:number;limit:number;total:number;totalPages:number}
export interface UserPreferences{language:'tr'|'en'|'ar';favoriteCategories:string[];emailNotifications:boolean;smsNotifications:boolean}
export interface User{id:string;fullName:string;email:string;phone?:string;role:Role;avatar?:string;status:UserStatus;preferences?:UserPreferences;createdAt?:string}
export interface CastMember{name:string;role:string;image?:string}
export interface Event{id:string;title:string;slug:string;description:string;shortDescription:string;posterImage:string;gallery:string[];trailerUrl?:string;category:string;language:string;durationMinutes:number;ageLimit:string;cast:CastMember[];director:string;status:EventStatus;priceFrom?:number}
export interface Seat{code:string;row?:string;number?:number;category:SeatCategory;price:number;status:SeatStatus;isAccessible?:boolean;isBlocked?:boolean;position?:{x:number;y:number}}
export interface Hall{id:string;name:string;description?:string;capacity:number;rows:number;seatsPerRow:number;seatMap:Seat[];status:'ACTIVE'|'MAINTENANCE'|'INACTIVE'}
export interface Showtime{id:string;event:Event|string;hall:Hall|string;date:string;startTime:string;endTime:string;status:ShowtimeStatus;pricing:Record<SeatCategory,number>;availableFrom?:string;availableUntil?:string}
export interface BookingSeat{seatCode:string;category:SeatCategory;price:number}
export interface Booking{id:string;bookingNumber:string;user:User|string;showtime:Showtime|string;seats:BookingSeat[];status:BookingStatus;subtotal:number;serviceFee:number;discount:number;tax:number;total:number;expiresAt?:string;source:'ONLINE'|'BOX_OFFICE';createdAt:string}
export interface Ticket{id:string;ticketNumber:string;booking:Booking|string;user:User|string;event:Event|string;showtime:Showtime|string;hall:Hall|string;seatCode:string;category:SeatCategory;price:number;qrToken:string;qrImage?:string;status:TicketStatus;usedAt?:string}
export interface Payment{id:string;paymentNumber:string;booking:Booking|string;user:User|string;provider:'IYZICO'|'STRIPE'|'PAYPAL'|'MOCK'|'CASH';method:'CARD'|'WALLET'|'CASH';amount:number;currency:string;status:PaymentStatus;providerTransactionId?:string;paidAt?:string;createdAt:string}
export interface Refund{id:string;refundNumber:string;booking:Booking|string;payment?:Payment|string;user:User|string;amount:number;reason:string;status:RefundStatus;createdAt:string}
export interface Notification{id:string;title:string;message:string;type:'EMAIL'|'SMS'|'SYSTEM';channel?:string;status:'PENDING'|'SENT'|'FAILED';read?:boolean;createdAt:string}
export interface DashboardReport{totalRevenue:number;ticketsSold:number;occupancyRate:number;refundRequests:number;newUsers:number;upcomingShows:number}
export interface SistemSettings{websiteName:string;logo?:string;theme:{primary:string;accent:string;mode:'dark'|'light'};ticketRules:{seatHoldMinutes:number;cancellationDeadlineHours:number;refundAllowed:boolean;serviceFee:number;taxRate:number};maintenanceMode:boolean}
