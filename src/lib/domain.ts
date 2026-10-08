import type { Tables } from "@/integrations/supabase/types";

export type Band = Tables<"bands">;
export type Song = Tables<"songs">;
export type Album = Tables<"albums">;
export type Product = Tables<"products">;
export type BandEvent = Tables<"events">;
export type Post = Tables<"posts">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type Profile = Tables<"profiles">;

export type BandSocial = { label: string; url: string };

export type BandProfilePayload = {
  band: Band;
  songs: Song[];
  albums: Album[];
  products: Product[];
  events: BandEvent[];
  posts: Post[];
  followers: number;
};

export type FeedPost = Post & {
  band: Pick<Band, "id" | "slug" | "name" | "avatar_url">;
  likes: number;
};

export type DashboardOrderRow = {
  id: string;
  customer_name: string;
  total: number;
  status: Tables<"orders">["status"];
  created_at: string;
  items: { product_name: string; quantity: number; on_demand: boolean }[];
};