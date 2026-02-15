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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_resume_points: {
        Row: {
          created_at: string
          id: string
          position_seconds: number
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position_seconds?: number
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position_seconds?: number
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      video_view_pings: {
        Row: {
          created_at: string
          id: string
          increment_seconds: number
          position_seconds: number
          session_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          increment_seconds?: number
          position_seconds: number
          session_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          increment_seconds?: number
          position_seconds?: number
          session_id?: string
          video_id?: string
        }
        Relationships: []
      }
      video_view_sessions: {
        Row: {
          anon_id: string
          created_at: string
          id: string
          last_seen_at: string
          max_position_seconds: number
          total_watched_seconds: number
          video_id: string
        }
        Insert: {
          anon_id: string
          created_at?: string
          id?: string
          last_seen_at?: string
          max_position_seconds?: number
          total_watched_seconds?: number
          video_id: string
        }
        Update: {
          anon_id?: string
          created_at?: string
          id?: string
          last_seen_at?: string
          max_position_seconds?: number
          total_watched_seconds?: number
          video_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          aspect_ratio: string | null
          autoplay: boolean
          bucket_id: string | null
          bunny_id: string | null
          controls_visible: boolean | null
          cover_color: string | null
          cover_gradient_from: string | null
          cover_gradient_to: string | null
          cover_image_url: string | null
          cover_mode: string
          cover_opacity: number
          cover_saturation: number
          created_at: string
          cta_bg_color: string | null
          cta_delay_seconds: number | null
          cta_enabled: boolean
          cta_text: string | null
          cta_text_color: string | null
          cta_url: string | null
          cta_variant: string
          custom_css: string | null
          description: string | null
          domain_lock: string | null
          fake_live_mode: boolean | null
          feature_domain_lock: boolean
          feature_live_simulator: boolean
          hero_font_family: string | null
          hero_headline: string | null
          hero_headline_enabled: boolean
          hero_headline_size: number | null
          hero_headline_style: string | null
          hero_subheadline: string | null
          hero_subheadline_enabled: boolean
          hero_subheadline_size: number | null
          hero_subheadline_style: string | null
          hero_text_color: string | null
          icon_style: string
          id: string
          layout_ratio: string
          loop: boolean
          mime_type: string | null
          play_button_style: string | null
          player_click_toggle: boolean
          primary_color: string | null
          progress_color: string | null
          show_controls: boolean
          size_bytes: number | null
          smart_autoplay: boolean | null
          smart_autoplay_enabled: boolean
          smart_end_enabled: boolean
          smart_end_text: string | null
          smart_pause_enabled: boolean
          smart_pause_text: string | null
          smart_prompt_subtitle: string | null
          smart_prompt_title: string | null
          smart_prompt_variant: string
          smart_reload_continue_text: string | null
          smart_reload_enabled: boolean
          smart_reload_restart_text: string | null
          status: string
          storage_path: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          vsl_page_type: string
        }
        Insert: {
          aspect_ratio?: string | null
          autoplay?: boolean
          bucket_id?: string | null
          bunny_id?: string | null
          controls_visible?: boolean | null
          cover_color?: string | null
          cover_gradient_from?: string | null
          cover_gradient_to?: string | null
          cover_image_url?: string | null
          cover_mode?: string
          cover_opacity?: number
          cover_saturation?: number
          created_at?: string
          cta_bg_color?: string | null
          cta_delay_seconds?: number | null
          cta_enabled?: boolean
          cta_text?: string | null
          cta_text_color?: string | null
          cta_url?: string | null
          cta_variant?: string
          custom_css?: string | null
          description?: string | null
          domain_lock?: string | null
          fake_live_mode?: boolean | null
          feature_domain_lock?: boolean
          feature_live_simulator?: boolean
          hero_font_family?: string | null
          hero_headline?: string | null
          hero_headline_enabled?: boolean
          hero_headline_size?: number | null
          hero_headline_style?: string | null
          hero_subheadline?: string | null
          hero_subheadline_enabled?: boolean
          hero_subheadline_size?: number | null
          hero_subheadline_style?: string | null
          hero_text_color?: string | null
          icon_style?: string
          id?: string
          layout_ratio?: string
          loop?: boolean
          mime_type?: string | null
          play_button_style?: string | null
          player_click_toggle?: boolean
          primary_color?: string | null
          progress_color?: string | null
          show_controls?: boolean
          size_bytes?: number | null
          smart_autoplay?: boolean | null
          smart_autoplay_enabled?: boolean
          smart_end_enabled?: boolean
          smart_end_text?: string | null
          smart_pause_enabled?: boolean
          smart_pause_text?: string | null
          smart_prompt_subtitle?: string | null
          smart_prompt_title?: string | null
          smart_prompt_variant?: string
          smart_reload_continue_text?: string | null
          smart_reload_enabled?: boolean
          smart_reload_restart_text?: string | null
          status?: string
          storage_path?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          vsl_page_type?: string
        }
        Update: {
          aspect_ratio?: string | null
          autoplay?: boolean
          bucket_id?: string | null
          bunny_id?: string | null
          controls_visible?: boolean | null
          cover_color?: string | null
          cover_gradient_from?: string | null
          cover_gradient_to?: string | null
          cover_image_url?: string | null
          cover_mode?: string
          cover_opacity?: number
          cover_saturation?: number
          created_at?: string
          cta_bg_color?: string | null
          cta_delay_seconds?: number | null
          cta_enabled?: boolean
          cta_text?: string | null
          cta_text_color?: string | null
          cta_url?: string | null
          cta_variant?: string
          custom_css?: string | null
          description?: string | null
          domain_lock?: string | null
          fake_live_mode?: boolean | null
          feature_domain_lock?: boolean
          feature_live_simulator?: boolean
          hero_font_family?: string | null
          hero_headline?: string | null
          hero_headline_enabled?: boolean
          hero_headline_size?: number | null
          hero_headline_style?: string | null
          hero_subheadline?: string | null
          hero_subheadline_enabled?: boolean
          hero_subheadline_size?: number | null
          hero_subheadline_style?: string | null
          hero_text_color?: string | null
          icon_style?: string
          id?: string
          layout_ratio?: string
          loop?: boolean
          mime_type?: string | null
          play_button_style?: string | null
          player_click_toggle?: boolean
          primary_color?: string | null
          progress_color?: string | null
          show_controls?: boolean
          size_bytes?: number | null
          smart_autoplay?: boolean | null
          smart_autoplay_enabled?: boolean
          smart_end_enabled?: boolean
          smart_end_text?: string | null
          smart_pause_enabled?: boolean
          smart_pause_text?: string | null
          smart_prompt_subtitle?: string | null
          smart_prompt_title?: string | null
          smart_prompt_variant?: string
          smart_reload_continue_text?: string | null
          smart_reload_enabled?: boolean
          smart_reload_restart_text?: string | null
          status?: string
          storage_path?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          vsl_page_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      telemetry_session_valid_for_ping: {
        Args: { _session_id: string; _video_id: string }
        Returns: boolean
      }
      video_exists: { Args: { _video_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
