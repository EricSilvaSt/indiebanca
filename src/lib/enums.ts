import type { Database } from "@/integrations/supabase/types";

export type Genre = Database["public"]["Enums"]["genre"];
export type ArtistType = Database["public"]["Enums"]["artist_type"];
export type ProductCategory = Database["public"]["Enums"]["product_category"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PostType = Database["public"]["Enums"]["post_type"];

export const GENRES: Genre[] = [
  "Rock",
  "Metal",
  "Punk",
  "Hardcore",
  "Blues",
  "Indie",
  "Rap",
  "Reggae",
  "MPB",
  "Outros",
];

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Camisetas",
  "Bonés",
  "CDs",
  "Vinis",
  "Adesivos",
  "Palhetas",
  "Posters",
  "Personalizados",
];

export const ORDER_STATUSES: OrderStatus[] = ["Pendente", "Em produção", "Enviado", "Entregue"];

export const ARTIST_TYPES: ArtistType[] = ["Banda", "Artista solo"];