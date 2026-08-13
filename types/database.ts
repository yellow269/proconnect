export type UserRole = "customer" | "professional" | "admin";
export type JobStatus = "draft" | "open" | "quoted" | "assigned" | "in_progress" | "completed" | "cancelled";
export type QuoteStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type SubscriptionPlan = "free" | "pro";
export type SubscriptionStatus = "inactive" | "trialing" | "active" | "past_due" | "cancelled" | "expired";
export type NotificationType = "job" | "quote" | "review" | "subscription" | "system";
export type PricingType = "fixed" | "starting_from" | "quote";
export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "deposit_paid" | "paid" | "refunded";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          city: string | null;
          province: string | null;
          location: unknown | null;
          email_notifications: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          province?: string | null;
          location?: unknown | null;
          email_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          province?: string | null;
          location?: unknown | null;
          email_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      professional_profiles: {
        Row: {
          user_id: string;
          business_name: string;
          slug: string;
          bio: string | null;
          website: string | null;
          years_experience: number | null;
          verified: boolean;
          available: boolean;
          average_rating: number;
          review_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          business_name: string;
          slug: string;
          bio?: string | null;
          website?: string | null;
          years_experience?: number | null;
          verified?: boolean;
          available?: boolean;
          average_rating?: number;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          business_name?: string;
          slug?: string;
          bio?: string | null;
          website?: string | null;
          years_experience?: number | null;
          verified?: boolean;
          available?: boolean;
          average_rating?: number;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          professional_id: string;
          category_id: string;
          title: string;
          description: string | null;
          price_from: number | null;
          pricing_type: PricingType;
          fixed_price: number | null;
          duration_minutes: number | null;
          image_url: string | null;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          category_id: string;
          title: string;
          description?: string | null;
          price_from?: number | null;
          pricing_type?: PricingType;
          fixed_price?: number | null;
          duration_minutes?: number | null;
          image_url?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          professional_id?: string;
          category_id?: string;
          title?: string;
          description?: string | null;
          price_from?: number | null;
          pricing_type?: PricingType;
          fixed_price?: number | null;
          duration_minutes?: number | null;
          image_url?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professional_profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "services_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          id: string;
          customer_id: string;
          category_id: string;
          title: string;
          description: string;
          status: JobStatus;
          budget_min: number | null;
          budget_max: number | null;
          city: string;
          province: string;
          location: unknown | null;
          desired_date: string | null;
          assigned_professional_id: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          category_id: string;
          title: string;
          description: string;
          status?: JobStatus;
          budget_min?: number | null;
          budget_max?: number | null;
          city: string;
          province: string;
          location?: unknown | null;
          desired_date?: string | null;
          assigned_professional_id?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          category_id?: string;
          title?: string;
          description?: string;
          status?: JobStatus;
          budget_min?: number | null;
          budget_max?: number | null;
          city?: string;
          province?: string;
          location?: unknown | null;
          desired_date?: string | null;
          assigned_professional_id?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_assigned_professional_id_fkey";
            columns: ["assigned_professional_id"];
            isOneToOne: false;
            referencedRelation: "professional_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      job_images: {
        Row: {
          id: string;
          job_id: string;
          storage_path: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          storage_path: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          storage_path?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_images_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      quotes: {
        Row: {
          id: string;
          job_id: string;
          professional_id: string;
          amount: number;
          message: string;
          estimated_days: number | null;
          status: QuoteStatus;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          professional_id: string;
          amount: number;
          message: string;
          estimated_days?: number | null;
          status?: QuoteStatus;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          professional_id?: string;
          amount?: number;
          message?: string;
          estimated_days?: number | null;
          status?: QuoteStatus;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professional_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          job_id: string;
          customer_id: string;
          professional_id: string;
          rating: number;
          comment: string | null;
          response: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          customer_id: string;
          professional_id: string;
          rating: number;
          comment?: string | null;
          response?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          customer_id?: string;
          professional_id?: string;
          rating?: number;
          comment?: string | null;
          response?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: true;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professional_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      favorites: {
        Row: {
          customer_id: string;
          professional_id: string;
          created_at: string;
        };
        Insert: {
          customer_id: string;
          professional_id: string;
          created_at?: string;
        };
        Update: {
          customer_id?: string;
          professional_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professional_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      portfolio_items: {
        Row: {
          id: string;
          professional_id: string;
          title: string;
          description: string | null;
          storage_path: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          title: string;
          description?: string | null;
          storage_path: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          professional_id?: string;
          title?: string;
          description?: string | null;
          storage_path?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "portfolio_items_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professional_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      availability: {
        Row: {
          id: string;
          professional_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
        };
        Update: {
          id?: string;
          professional_id?: string;
          weekday?: number;
          start_time?: string;
          end_time?: string;
        };
        Relationships: [
          {
            foreignKeyName: "availability_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professional_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          professional_id: string;
          user_id: string | null;
          plan: SubscriptionPlan;
          plan_name: string | null;
          amount: number | null;
          currency: string | null;
          status: SubscriptionStatus;
          payfast_token: string | null;
          payfast_subscription_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          next_billing_date: string | null;
          cancel_at_period_end: boolean;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          user_id?: string | null;
          plan?: SubscriptionPlan;
          plan_name?: string | null;
          amount?: number | null;
          currency?: string | null;
          status?: SubscriptionStatus;
          payfast_token?: string | null;
          payfast_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          next_billing_date?: string | null;
          cancel_at_period_end?: boolean;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          professional_id?: string;
          user_id?: string | null;
          plan?: SubscriptionPlan;
          plan_name?: string | null;
          amount?: number | null;
          currency?: string | null;
          status?: SubscriptionStatus;
          payfast_token?: string | null;
          payfast_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          next_billing_date?: string | null;
          cancel_at_period_end?: boolean;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: true;
            referencedRelation: "professional_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          link?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          body?: string;
          link?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          subject_type: string;
          subject_id: string;
          reason: string;
          resolved_at: string | null;
          resolved_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          subject_type: string;
          subject_id: string;
          reason: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          subject_type?: string;
          subject_id?: string;
          reason?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          customer_id: string;
          professional_id: string;
          job_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          professional_id: string;
          job_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          professional_id?: string;
          job_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          message: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          message: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          message?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      service_bookings: {
        Row: {
          id: string;
          service_id: string;
          professional_id: string;
          customer_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          status: BookingStatus;
          payment_status: PaymentStatus;
          total_amount: number;
          deposit_amount: number | null;
          notes: string | null;
          address: string | null;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          professional_id: string;
          customer_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          status?: BookingStatus;
          payment_status?: PaymentStatus;
          total_amount: number;
          deposit_amount?: number | null;
          notes?: string | null;
          address?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_id?: string;
          professional_id?: string;
          customer_id?: string;
          booking_date?: string;
          start_time?: string;
          end_time?: string;
          status?: BookingStatus;
          payment_status?: PaymentStatus;
          total_amount?: number;
          deposit_amount?: number | null;
          notes?: string | null;
          address?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_bookings_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_bookings_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professional_profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "service_bookings_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      professional_storefront_settings: {
        Row: {
          user_id: string;
          whatsapp_number: string | null;
          custom_description: string | null;
          cover_image_url: string | null;
          service_area: string | null;
          show_portfolio: boolean;
          show_reviews: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          whatsapp_number?: string | null;
          custom_description?: string | null;
          cover_image_url?: string | null;
          service_area?: string | null;
          show_portfolio?: boolean;
          show_reviews?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          whatsapp_number?: string | null;
          custom_description?: string | null;
          cover_image_url?: string | null;
          service_area?: string | null;
          show_portfolio?: boolean;
          show_reviews?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "professional_storefront_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "professional_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
    };
    Views: {};
    Functions: {
      promote_to_professional: {
        Args: Record<string, never>;
        Returns: void;
      };
      seed_categories: {
        Args: Record<string, never>;
        Returns: void;
      };
      has_booking_conflict: {
        Args: {
          p_professional_id: string;
          p_date: string;
          p_start_time: string;
          p_end_time: string;
          p_exclude_booking_id?: string;
        };
        Returns: boolean;
      };
      get_available_slots: {
        Args: {
          p_professional_id: string;
          p_date: string;
          p_duration_minutes: number;
        };
        Returns: { slot_start: string; slot_end: string }[];
      };
    };
    Enums: {
      user_role: UserRole;
      job_status: JobStatus;
      quote_status: QuoteStatus;
      subscription_plan: SubscriptionPlan;
      subscription_status: SubscriptionStatus;
      notification_type: NotificationType;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
