export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      albums: {
        Row: {
          band_id: string
          cover_url: string | null
          created_at: string
          id: string
          release_date: string | null
          release_year: number
          title: string
          type: Database["public"]["Enums"]["album_type"]
          updated_at: string
        }
        Insert: {
          band_id: string
          cover_url?: string | null
          created_at?: string
          id?: string
          release_date?: string | null
          release_year?: number
          title: string
          type?: Database["public"]["Enums"]["album_type"]
          updated_at?: string
        }
        Update: {
          band_id?: string
          cover_url?: string | null
          created_at?: string
          id?: string
          release_date?: string | null
          release_year?: number
          title?: string
          type?: Database["public"]["Enums"]["album_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      band_claims: {
        Row: {
          band_id: string
          claimant_user_id: string
          claimed_role: string
          created_at: string
          evidence: string
          id: string
          official_url: string
          review_notes: string | null
          reviewed_at: string | null
          reviewer_user_id: string | null
          status: Database["public"]["Enums"]["claim_status"]
          updated_at: string
        }
        Insert: {
          band_id: string
          claimant_user_id: string
          claimed_role: string
          created_at?: string
          evidence: string
          id?: string
          official_url: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_user_id?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
        }
        Update: {
          band_id?: string
          claimant_user_id?: string
          claimed_role?: string
          created_at?: string
          evidence?: string
          id?: string
          official_url?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_user_id?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "band_claims_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      band_invitations: {
        Row: {
          band_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["band_member_role"]
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
        }
        Insert: {
          band_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["band_member_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Update: {
          band_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["band_member_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "band_invitations_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      band_members: {
        Row: {
          band_id: string
          created_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["band_member_role"]
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          band_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["band_member_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          band_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["band_member_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "band_members_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      bands: {
        Row: {
          avatar_url: string | null
          bio: string
          city: string
          country: string
          cover_url: string | null
          created_at: string
          featured: boolean
          genre: Database["public"]["Enums"]["genre"]
          id: string
          monthly_listeners: number
          name: string
          owner_user_id: string | null
          slug: string
          socials: Json
          state: string
          support_enabled: boolean
          type: Database["public"]["Enums"]["artist_type"]
          updated_at: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          city?: string
          country?: string
          cover_url?: string | null
          created_at?: string
          featured?: boolean
          genre?: Database["public"]["Enums"]["genre"]
          id?: string
          monthly_listeners?: number
          name: string
          owner_user_id?: string | null
          slug: string
          socials?: Json
          state?: string
          support_enabled?: boolean
          type?: Database["public"]["Enums"]["artist_type"]
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          city?: string
          country?: string
          cover_url?: string | null
          created_at?: string
          featured?: boolean
          genre?: Database["public"]["Enums"]["genre"]
          id?: string
          monthly_listeners?: number
          name?: string
          owner_user_id?: string | null
          slug?: string
          socials?: Json
          state?: string
          support_enabled?: boolean
          type?: Database["public"]["Enums"]["artist_type"]
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          band_id: string
          city: string
          created_at: string
          description: string
          event_date: string
          event_time: string
          id: string
          title: string
          venue: string
        }
        Insert: {
          band_id: string
          city?: string
          created_at?: string
          description?: string
          event_date: string
          event_time?: string
          id?: string
          title: string
          venue?: string
        }
        Update: {
          band_id?: string
          city?: string
          created_at?: string
          description?: string
          event_date?: string
          event_time?: string
          id?: string
          title?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          band_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          band_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          band_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          band_id: string | null
          created_at: string
          id: string
          link: string | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          band_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          band_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          band_id: string
          created_at: string
          id: string
          on_demand: boolean
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          band_id: string
          created_at?: string
          id?: string
          on_demand?: boolean
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          band_id?: string
          created_at?: string
          id?: string
          on_demand?: boolean
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          id: string
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          band_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          type: Database["public"]["Enums"]["post_type"]
        }
        Insert: {
          band_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          type?: Database["public"]["Enums"]["post_type"]
        }
        Update: {
          band_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          type?: Database["public"]["Enums"]["post_type"]
        }
        Relationships: [
          {
            foreignKeyName: "posts_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          band_id: string
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          description: string
          id: string
          image_url: string | null
          name: string
          on_demand: boolean
          price: number
          stock: number | null
          updated_at: string
        }
        Insert: {
          band_id: string
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          name: string
          on_demand?: boolean
          price: number
          stock?: number | null
          updated_at?: string
        }
        Update: {
          band_id?: string
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          name?: string
          on_demand?: boolean
          price?: number
          stock?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      songs: {
        Row: {
          album: string
          album_id: string | null
          audio_url: string | null
          band_id: string
          cover_url: string | null
          created_at: string
          duration: string
          external_url: string | null
          id: string
          plays: number
          position: number
          title: string
          track_number: number | null
          year: number
        }
        Insert: {
          album?: string
          album_id?: string | null
          audio_url?: string | null
          band_id: string
          cover_url?: string | null
          created_at?: string
          duration?: string
          external_url?: string | null
          id?: string
          plays?: number
          position?: number
          title: string
          track_number?: number | null
          year?: number
        }
        Update: {
          album?: string
          album_id?: string | null
          audio_url?: string | null
          band_id?: string
          cover_url?: string | null
          created_at?: string
          duration?: string
          external_url?: string | null
          id?: string
          plays?: number
          position?: number
          title?: string
          track_number?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "songs_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      tips: {
        Row: {
          amount: number
          band_id: string
          created_at: string
          id: string
          message: string
          provider_reference: string | null
          status: Database["public"]["Enums"]["tip_status"]
          supporter_email: string
          supporter_name: string
          supporter_user_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          band_id: string
          created_at?: string
          id?: string
          message?: string
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["tip_status"]
          supporter_email: string
          supporter_name: string
          supporter_user_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          band_id?: string
          created_at?: string
          id?: string
          message?: string
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["tip_status"]
          supporter_email?: string
          supporter_name?: string
          supporter_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tips_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_band_invitation: {
        Args: { _invitation_id: string }
        Returns: string
      }
      approve_band_claim: {
        Args: { _claim_id: string; _notes?: string }
        Returns: undefined
      }
      band_owner_has_item_in_order: {
        Args: { _order_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_band_member: {
        Args: {
          _band_id: string
          _roles?: Database["public"]["Enums"]["band_member_role"][]
        }
        Returns: boolean
      }
      is_band_owner: { Args: { _band_id: string }; Returns: boolean }
      review_band_claim: {
        Args: {
          _claim_id: string
          _decision: Database["public"]["Enums"]["claim_status"]
          _notes?: string | null
        }
        Returns: undefined
      }
      set_band_support: {
        Args: { _band_id: string; _enabled: boolean }
        Returns: undefined
      }
      user_owns_order: { Args: { _order_id: string }; Returns: boolean }
    }
    Enums: {
      album_type: "Álbum" | "EP" | "Single" | "Ao vivo" | "Coletânea"
      app_role: "admin" | "moderator" | "user"
      artist_type: "Banda" | "Artista solo"
      band_member_role: "owner" | "admin" | "editor" | "member"
      claim_status: "pending" | "approved" | "rejected"
      genre:
        | "Rock"
        | "Metal"
        | "Punk"
        | "Hardcore"
        | "Blues"
        | "Indie"
        | "Rap"
        | "Reggae"
        | "MPB"
        | "Outros"
      membership_status: "pending" | "active" | "revoked"
      order_status: "Pendente" | "Em produção" | "Enviado" | "Entregue"
      post_type: "post" | "evento"
      product_category:
        | "Camisetas"
        | "Bonés"
        | "CDs"
        | "Vinis"
        | "Adesivos"
        | "Palhetas"
        | "Posters"
        | "Personalizados"
      tip_status: "pending" | "paid" | "failed" | "refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  },
  indiebanca: Database["public"]
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "indiebanca">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      album_type: ["Álbum", "EP", "Single", "Ao vivo", "Coletânea"],
      app_role: ["admin", "moderator", "user"],
      artist_type: ["Banda", "Artista solo"],
      band_member_role: ["owner", "admin", "editor", "member"],
      claim_status: ["pending", "approved", "rejected"],
      genre: [
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
      ],
      membership_status: ["pending", "active", "revoked"],
      order_status: ["Pendente", "Em produção", "Enviado", "Entregue"],
      post_type: ["post", "evento"],
      product_category: [
        "Camisetas",
        "Bonés",
        "CDs",
        "Vinis",
        "Adesivos",
        "Palhetas",
        "Posters",
        "Personalizados",
      ],
      tip_status: ["pending", "paid", "failed", "refunded"],
    },
  },
} as const
