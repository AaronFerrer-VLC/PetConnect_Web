// src/lib/types.ts
export type ID = string;

export type ServiceType =
  | "boarding"
  | "daycare"
  | "walking"
  | "house_sitting"
  | "drop_in";

export interface User {
  id: ID;
  name: string;
  email: string;
  city?: string;
  is_caretaker?: boolean;
  photo?: string;
}

/** ====== Servicios ====== */
export interface Service {
  id: ID;
  caretaker_id: ID;
  type: ServiceType;
  price: number;
  description?: string;
  enabled?: boolean;
}

/** ====== Reseñas ====== */
export interface Review {
  id: ID;
  sitter_id: ID;
  booking_id: ID;
  rating: number;
  comment?: string;
  author?: string;
  created_at?: string;
}

/** ====== Reservas ====== */
export type BookingStatus = "pending" | "accepted" | "rejected" | "completed";

// Nota: El backend usa start/end (datetime), no start_date/end_date
// Esta interfaz está aquí por compatibilidad, pero api.ts define Booking con start/end
export interface BookingLegacy {
  id: ID;
  owner_id: ID;
  caretaker_id: ID;
  sitter_id?: ID;
  status: BookingStatus;
  start_date: string; // ISO
  end_date: string;   // ISO
  service_type: ServiceType;
  total?: number;
}

/** ====== Pagos ====== */
export interface Payment {
  id: ID;
  booking_id: ID;
  owner_id: ID;
  caretaker_id: ID;
  amount: number;
  platform_fee: number;
  caretaker_payout: number;
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  payment_method: "card" | "bank_transfer";
  transaction_id?: string;
  created_at: string;
  completed_at?: string;
}

/** ====== Mascotas (alineado con tu Pets.tsx) ======
 *  Nota: algunos campos son null en el formulario, así que los declaramos como `| null`
 */
export type PetSex = "M" | "F" | "unknown";

export interface Pet {
  id: ID;
  name: string;
  breed?: string;

  /** numérico o null (lo usas así en el formulario) */
  age_years: number | null;

  /** numérico o null (lo usas así en el formulario) */
  weight_kg: number | null;

  /** "M" | "F" | "unknown" (por defecto unknown) */
  sex?: PetSex;

  photos?: string[];

  /** Campos de texto ricos que usas en el modal */
  personality?: string;
  care_instructions?: string;
  needs?: string;
  notes?: string;

  /** opcionales por si más adelante te vienen bien */
  species?: "dog" | "cat";
  birthdate?: string;      // ISO
  owner_id?: ID;
}
