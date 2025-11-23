// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// -------- helper fetch con token (fix HeadersInit) --------
async function request<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  // objeto plano -> seguro para mutar y añadir Authorization
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (init.headers) {
    const h = new Headers(init.headers as HeadersInit);
    h.forEach((value, key) => (headers[key] = value));
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await res.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = (data && (data.detail || data.message || data.error)) || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return data as T;
}
// -----------------------------------------------------------

// =================== Tipos compartidos =====================
// Los tipos están definidos en types.ts - los reexportamos aquí para compatibilidad
export type { ServiceType, Service, Pet, BookingStatus } from "./types";

// Booking en el backend usa start/end, no start_date/end_date
export interface Booking {
  id: string;
  owner_id: string;
  caretaker_id: string;
  pet_id: string;
  service_id: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  status: BookingStatus;
}

export interface SitterCard {
  id: string;
  name: string;
  city?: string;
  photo?: string;
  services?: string[];
  min_price?: number;
  rating_avg?: number;
  rating_count?: number;
  accepts_sizes?: string[];
  lat?: number;
  lng?: number;
  distance_km?: number;
  // flags opcionales
  [key: string]: any;
}
// ===========================================================


// ======================== AUTH =============================
export const AuthAPI = {
  async signup(payload: {
    name: string; email: string; password: string;
    city?: string; is_caretaker?: boolean;
    photo?: string; bio?: string; // NUEVO
  }) {
    return request("/auth/signup", { method: "POST", body: JSON.stringify(payload) });
  },
  async login(payload: { email: string; password: string }) {
    return request<{ access_token: string }>("/auth/login", { method: "POST", body: JSON.stringify(payload) });
  },
  async me() {
    return request("/users/me");
  },
};

export async function getMe() {
  try { return await AuthAPI.me(); } catch { return null; }
}

// ======================== USERS ============================
export const UsersAPI = {
  updateMe: (payload: any) =>
    request("/users/me", { method: "PATCH", body: JSON.stringify(payload) }),
  addToGallery: (images: string[]) =>
    request<string[]>("/users/me/gallery", { method: "POST", body: JSON.stringify({ images }) }),
  removeFromGallery: (url: string) =>
    request<string[]>(`/users/me/gallery?url=${encodeURIComponent(url)}`, { method: "DELETE" }),
};



// ======================== PETS =============================
export const PetsAPI = {
  list: () => request<Pet[]>("/pets"),
  create: (payload: Omit<Pet, "id">) => request<Pet>("/pets", { method: "POST", body: JSON.stringify(payload) }),
  remove: (id: string) => request(`/pets/${id}`, { method: "DELETE" }),
};
// ===========================================================


// ====================== SERVICES ===========================
export const ServicesAPI = {
  list: () => request<Service[]>("/services"),
  bySitter: (sitterId: string) => request<Service[]>(`/services?sitter_id=${encodeURIComponent(sitterId)}`),
  create: (payload: { type: ServiceType; price: number; description?: string }) =>
    request<Service>("/services", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<Pick<Service, "price" | "description" | "enabled">>) =>
    request<Service>(`/services/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  toggle: (id: string, enabled: boolean) =>
    request<Service>(`/services/${id}/toggle`, { method: "POST", body: JSON.stringify({ enabled }) }),
  remove: (id: string) =>
    request<void>(`/services/${id}`, { method: "DELETE" }),   // 👈 NUEVO
};
// ===========================================================


// ===================== AVAILABILITY ========================
export const AvailabilityAPI = {
  get: () =>
    request<{ max_pets: number; blocked_dates: string[]; weekly_open: Record<string, boolean> }>(
      "/users/me/availability"
    ),

  // Guardar toda la availability (uso interno)
  set: (payload: { max_pets?: number; blocked_dates?: string[]; weekly_open?: Record<string, boolean> }) =>
    request("/users/me/availability", { method: "PATCH", body: JSON.stringify(payload) }),

  async blockDates(dates: string[]) {
    const cur = await AvailabilityAPI.get();
    const set = new Set([...cur.blocked_dates, ...dates]);
    return AvailabilityAPI.set({ blocked_dates: Array.from(set).sort() });
  },

  async unblockDates(dates: string[]) {
    const cur = await AvailabilityAPI.get();
    const set = new Set(cur.blocked_dates);
    dates.forEach((d) => set.delete(d));
    return AvailabilityAPI.set({ blocked_dates: Array.from(set).sort() });
  },

  setWeeklyOpen: (partial: Record<string, boolean>) =>
    AvailabilityAPI.set({ weekly_open: partial }),

  setMaxPets: (value: number) => AvailabilityAPI.set({ max_pets: value }),
};
// ===========================================================


// ====================== BOOKINGS ===========================
export const BookingsAPI = {
  listMine: () => request<Booking[]>("/bookings/mine"),
  // ojo: owner_id viene del token en backend -> no lo pedimos aquí
  create: (payload: { caretaker_id: string; service_id: string; pet_id: string; start: string; end: string }) =>
    request<Booking>("/bookings", { method: "POST", body: JSON.stringify(payload) }),
  get: (id: string) => request<Booking>(`/bookings/${id}`),
  updateStatus: (id: string, status: BookingStatus) =>
    request<Booking>(`/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};
// ===========================================================


// =================== SITTERS / SEARCH ======================
export function searchSitters(q: Record<string, string | number | undefined>) {
  const url = new URL(`${API_URL}/sitters/search`);
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  });
  return request<SitterCard[]>(url.pathname + url.search);
}

export const GeolocationAPI = {
  updateLocation: (lat: number, lng: number) =>
    request("/users/me", {
      method: "PATCH",
      body: JSON.stringify({ lat, lng }),
    }),
};

export const getSitter = (id: string) => request<any>(`/sitters/${id}`);
// ===========================================================


// ======================== MESSAGES =========================
export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  created_at: string;
  read?: boolean;
  read_at?: string;
}

export interface Thread {
  thread_id: string;
  other_user: any;
  last_message: Message;
  unread_count: number;
}

export const MessagesAPI = {
  list: (threadId?: string) =>
    request<Message[]>(`/messages${threadId ? `?thread_id=${encodeURIComponent(threadId)}` : ""}`),
  
  listThreads: () => request<Thread[]>("/messages/threads"),
  
  create: (payload: { thread_id: string; sender_id: string; receiver_id: string; body: string }) =>
    request<Message>("/messages", { method: "POST", body: JSON.stringify(payload) }),
  
  markRead: (messageId: string) =>
    request<Message>(`/messages/${messageId}/read`, { method: "PATCH" }),
  
  markThreadRead: (threadId: string) =>
    request<{ updated: number }>(`/messages/thread/${threadId}/read-all`, { method: "PATCH" }),
};
// ===========================================================

// ======================== REPORTS ===========================
export interface Report {
  id: string;
  booking_id: string;
  caretaker_id: string;
  type: "photo" | "check_in" | "update" | "activity";
  message?: string;
  photo_url?: string;
  activity_type?: string;
  created_at: string;
}

export const ReportsAPI = {
  create: (payload: {
    booking_id: string;
    type: "photo" | "check_in" | "update" | "activity";
    message?: string;
    photo_url?: string;
    activity_type?: string;
  }) => request<Report>("/reports", { method: "POST", body: JSON.stringify(payload) }),
  
  uploadPhoto: async (reportId: string, file: File) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    const res = await fetch(`${API_URL}/reports/${reportId}/photo`, {
      method: "POST",
      headers,
      body: formData,
    });
    
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    
    if (!res.ok) {
      const msg = (data && (data.detail || data.message || data.error)) || `${res.status} ${res.statusText}`;
      throw new Error(msg);
    }
    return data as Report;
  },
  
  getByBooking: (bookingId: string) => request<Report[]>(`/reports/booking/${bookingId}`),
  
  listMine: () => request<Report[]>("/reports/mine"),
};
// ===========================================================

// ======================== REVIEWS ==========================
export const ReviewsAPI = {
  // crear reseña
  create: (payload: { booking_id: string; sitter_id: string; rating: number; comment?: string }) =>
    request("/reviews", { method: "POST", body: JSON.stringify(payload) }),

  listBySitter: (sitterId: string) => request<any[]>(`/reviews?sitter_id=${encodeURIComponent(sitterId)}`),
};

export const getSitterReviews = (sitterId: string) => ReviewsAPI.listBySitter(sitterId);
// ===========================================================

// --- Billing -------------------------------------------------
export async function createCheckoutSession(
  plan: "pro" | "free" = "pro"
): Promise<{ url: string }> {
  // 1) Ruta "normal" (Stripe): devuelve { url }
  try {
    return await request<{ url: string }>("/billing/checkout-session", {
      method: "POST",
      body: JSON.stringify({ plan }),
    });
  } catch {
    // 2) Fallback demo/mock: alterna el plan sin pago y redirige a /pricing
    // Ajusta la ruta si tu mock usa otro path.
    try {
      await request("/billing/mock/upgrade", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      return { url: "/pricing?upgraded=1" };
    } catch (e) {
      throw e;
    }
  }
}
// ===========================================================

// ====================== PAYMENTS ===========================
export interface Payment {
  id: string;
  booking_id: string;
  owner_id: string;
  caretaker_id: string;
  amount: number;
  platform_fee: number;
  caretaker_payout: number;
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  payment_method: "card" | "bank_transfer";
  transaction_id?: string;
  created_at: string;
  completed_at?: string;
}

export const PaymentsAPI = {
  create: (payload: { booking_id: string; amount: number; payment_method?: "card" | "bank_transfer" }) =>
    request<Payment>("/payments", { method: "POST", body: JSON.stringify(payload) }),
  
  process: (paymentId: string) =>
    request<Payment>(`/payments/${paymentId}/process`, { method: "POST" }),
  
  listMine: () => request<Payment[]>("/payments/mine"),
  
  getByBooking: (bookingId: string) =>
    request<Payment | null>(`/payments/booking/${bookingId}`),
  
  refund: (paymentId: string) =>
    request<Payment>(`/payments/${paymentId}/refund`, { method: "POST" }),
};
// ===========================================================
