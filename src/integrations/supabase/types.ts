export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          metadata: Json | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: Json | null;
          tool_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: Json | null;
          tool_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
          tool_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_events_tool_id_fkey";
            columns: ["tool_id"];
            isOneToOne: false;
            referencedRelation: "tools";
            referencedColumns: ["id"];
          },
        ];
      };

      categories: {
        Row: {
          color: string | null;
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };

      newsletters: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          source: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          source?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          source?: string | null;
        };
        Relationships: [];
      };

      reviews: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          rating: number;
          status: Database["public"]["Enums"]["review_status"];
          title: string | null;
          tool_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          rating: number;
          status?: Database["public"]["Enums"]["review_status"];
          title?: string | null;
          tool_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          rating?: number;
          status?: Database["public"]["Enums"]["review_status"];
          title?: string | null;
          tool_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_tool_id_fkey";
            columns: ["tool_id"];
            isOneToOne: false;
            referencedRelation: "tools";
            referencedColumns: ["id"];
          },
        ];
      };

      tool_comparisons: {
        Row: {
          created_at: string;
          id: string;
          slug: string;
          summary: string | null;
          title: string;
          tool_a_id: string;
          tool_b_id: string;
          views: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          slug: string;
          summary?: string | null;
          title: string;
          tool_a_id: string;
          tool_b_id: string;
          views?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          slug?: string;
          summary?: string | null;
          title?: string;
          tool_a_id?: string;
          tool_b_id?: string;
          views?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tool_comparisons_tool_a_id_fkey";
            columns: ["tool_a_id"];
            isOneToOne: false;
            referencedRelation: "tools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tool_comparisons_tool_b_id_fkey";
            columns: ["tool_b_id"];
            isOneToOne: false;
            referencedRelation: "tools";
            referencedColumns: ["id"];
          },
        ];
      };
      tool_features: {
        Row: {
          feature: string;
          id: string;
          sort_order: number | null;
          tool_id: string;
        };
        Insert: {
          feature: string;
          id?: string;
          sort_order?: number | null;
          tool_id: string;
        };
        Update: {
          feature?: string;
          id?: string;
          sort_order?: number | null;
          tool_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tool_features_tool_id_fkey";
            columns: ["tool_id"];
            isOneToOne: false;
            referencedRelation: "tools";
            referencedColumns: ["id"];
          },
        ];
      };
      tool_screenshots: {
        Row: {
          caption: string | null;
          id: string;
          image_url: string;
          sort_order: number | null;
          tool_id: string;
        };
        Insert: {
          caption?: string | null;
          id?: string;
          image_url: string;
          sort_order?: number | null;
          tool_id: string;
        };
        Update: {
          caption?: string | null;
          id?: string;
          image_url?: string;
          sort_order?: number | null;
          tool_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tool_screenshots_tool_id_fkey";
            columns: ["tool_id"];
            isOneToOne: false;
            referencedRelation: "tools";
            referencedColumns: ["id"];
          },
        ];
      };
      tool_tags: {
        Row: {
          id: string;
          tag: string;
          tool_id: string;
        };
        Insert: {
          id?: string;
          tag: string;
          tool_id: string;
        };
        Update: {
          id?: string;
          tag?: string;
          tool_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tool_tags_tool_id_fkey";
            columns: ["tool_id"];
            isOneToOne: false;
            referencedRelation: "tools";
            referencedColumns: ["id"];
          },
        ];
      };
      tools: {
        Row: {
          affiliate_url: string | null;
          category_id: string | null;
          clicks: number;
          cons: string[] | null;
          cover_url: string | null;
          created_at: string;
          favicon_url: string | null;
          featured: boolean;
          full_description: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          platforms: string[] | null;
          pricing: Database["public"]["Enums"]["pricing_type"];
          pricing_details: string | null;
          pros: string[] | null;
          published_at: string | null;
          rating: number;
          review_count: number;
          short_description: string;
          slug: string;
          sponsored: boolean;
          status: Database["public"]["Enums"]["tool_status"];
          submitted_by: string | null;
          updated_at: string;
          verified: boolean;
          views: number;
          website_url: string;
          key_summary: string | null;
          secondary_categories: string[] | null;
          use_cases: string[] | null;
          compare_data: Json | null;
          needs_review: boolean;
          capabilities: string[] | null;
          industries: string[] | null;
          best_for: string[] | null;
          not_good_for: string[] | null;
        };
        Insert: {
          affiliate_url?: string | null;
          category_id?: string | null;
          clicks?: number;
          cons?: string[] | null;
          cover_url?: string | null;
          created_at?: string;
          favicon_url?: string | null;
          featured?: boolean;
          full_description?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          platforms?: string[] | null;
          pricing?: Database["public"]["Enums"]["pricing_type"];
          pricing_details?: string | null;
          pros?: string[] | null;
          published_at?: string | null;
          rating?: number;
          review_count?: number;
          short_description: string;
          slug: string;
          sponsored?: boolean;
          status?: Database["public"]["Enums"]["tool_status"];
          submitted_by?: string | null;
          updated_at?: string;
          verified?: boolean;
          views?: number;
          website_url: string;
          key_summary?: string | null;
          secondary_categories?: string[] | null;
          use_cases?: string[] | null;
          compare_data?: Json | null;
          needs_review?: boolean;
          capabilities?: string[] | null;
          industries?: string[] | null;
          best_for?: string[] | null;
          not_good_for?: string[] | null;
        };
        Update: {
          affiliate_url?: string | null;
          category_id?: string | null;
          clicks?: number;
          cons?: string[] | null;
          cover_url?: string | null;
          created_at?: string;
          favicon_url?: string | null;
          featured?: boolean;
          full_description?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          platforms?: string[] | null;
          pricing?: Database["public"]["Enums"]["pricing_type"];
          pricing_details?: string | null;
          pros?: string[] | null;
          published_at?: string | null;
          rating?: number;
          review_count?: number;
          short_description?: string;
          slug?: string;
          sponsored?: boolean;
          status?: Database["public"]["Enums"]["tool_status"];
          submitted_by?: string | null;
          updated_at?: string;
          verified?: boolean;
          views?: number;
          website_url?: string;
          key_summary?: string | null;
          secondary_categories?: string[] | null;
          use_cases?: string[] | null;
          compare_data?: Json | null;
          needs_review?: boolean;
          capabilities?: string[] | null;
          industries?: string[] | null;
          best_for?: string[] | null;
          not_good_for?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "tools_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      dynamic_categories: {
        Args: Record<PropertyKey, never>;
        Returns: {
          capability: string;
          tool_count: number;
        }[];
      };
      dynamic_use_cases: {
        Args: Record<PropertyKey, never>;
        Returns: {
          use_case: string;
          tool_count: number;
        }[];
      };
      dynamic_industries: {
        Args: Record<PropertyKey, never>;
        Returns: {
          industry: string;
          tool_count: number;
        }[];
      };
    };
    Enums: {
      pricing_type: "free" | "freemium" | "paid" | "subscription" | "one_time" | "contact";
      review_status: "pending" | "approved" | "rejected";
      tool_status: "draft" | "pending" | "approved" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "submitter", "user"],
      pricing_type: ["free", "freemium", "paid", "subscription", "one_time", "contact"],
      review_status: ["pending", "approved", "rejected"],
      submission_status: ["pending", "approved", "rejected"],
      tool_status: ["draft", "pending", "approved", "rejected"],
    },
  },
} as const;
