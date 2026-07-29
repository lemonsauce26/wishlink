export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          nickname: string | null;
          avatar_url: string | null;
          provider: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          nickname?: string | null;
          avatar_url?: string | null;
          provider?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          display_name?: string | null;
          nickname?: string | null;
          avatar_url?: string | null;
          provider?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          event_type: string;
          event_date: string | null;
          visibility: "public" | "private" | "inner_circle";
          share_token: string;
          reservation_visibility: "surprise" | "show" | "verified";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          event_type: string;
          event_date?: string | null;
          visibility?: "public" | "private" | "inner_circle";
          share_token?: string;
          reservation_visibility?: "surprise" | "show" | "verified";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          event_type?: string;
          event_date?: string | null;
          visibility?: "public" | "private" | "inner_circle";
          reservation_visibility?: "surprise" | "show" | "verified";
          updated_at?: string;
        };
        Relationships: [];
      };
      wish_items: {
        Row: {
          id: string;
          wishlist_id: string;
          title: string;
          image_url: string | null;
          price: number | null;
          currency: string;
          product_url: string | null;
          store_name: string | null;
          priority: "high" | "medium" | "low";
          quantity: number;
          note: string | null;
          receiving_method: "pickup" | "shipping" | "either" | "digital";
          receiving_detail: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wishlist_id: string;
          title: string;
          image_url?: string | null;
          price?: number | null;
          currency?: string;
          product_url?: string | null;
          store_name?: string | null;
          priority?: "high" | "medium" | "low";
          quantity?: number;
          note?: string | null;
          receiving_method?: "pickup" | "shipping" | "either" | "digital";
          receiving_detail?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          image_url?: string | null;
          price?: number | null;
          currency?: string;
          product_url?: string | null;
          store_name?: string | null;
          priority?: "high" | "medium" | "low";
          quantity?: number;
          note?: string | null;
          receiving_method?: "pickup" | "shipping" | "either" | "digital";
          receiving_detail?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      wishlist_invites: {
        Row: {
          id: string;
          wishlist_id: string;
          invitee_email: string;
          status: "pending" | "accepted" | "cancelled";
          accepted_user_id: string | null;
          invited_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          wishlist_id: string;
          invitee_email: string;
          status?: "pending" | "accepted" | "cancelled";
          accepted_user_id?: string | null;
          invited_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          status?: "pending" | "accepted" | "cancelled";
          accepted_user_id?: string | null;
          invited_at?: string;
          accepted_at?: string | null;
        };
        Relationships: [];
      };
      wishlist_visits: {
        Row: {
          id: string;
          wishlist_id: string;
          user_id: string;
          visited_at: string;
        };
        Insert: {
          id?: string;
          wishlist_id: string;
          user_id: string;
          visited_at?: string;
        };
        Update: {
          visited_at?: string;
        };
        Relationships: [];
      };
      wishitem_reservations: {
        Row: {
          id: string;
          wish_item_id: string;
          reserver_name: string;
          reserver_email: string | null;
          reserver_note: string | null;
          user_id: string | null;
          reserved_by_owner: boolean;
          cancel_token: string | null;
          reserved_at: string;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          wish_item_id: string;
          reserver_name: string;
          reserver_email?: string | null;
          reserver_note?: string | null;
          user_id?: string | null;
          reserved_by_owner?: boolean;
          cancel_token?: string | null;
          reserved_at?: string;
          cancelled_at?: string | null;
        };
        Update: {
          cancelled_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
  };
};
