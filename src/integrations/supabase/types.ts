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
      adjustments: {
        Row: {
          activity_description: string
          class_id: string | null
          created_at: string
          cultural_note: string | null
          curriculum_topic_id: string | null
          evidence_type: string
          generated_adjustment: string
          id: string
          implemented_at: string | null
          nccd_pillar: string
          rationale: string
          status: string
          student_id: string
          teacher_action: string | null
          trauma_note: string | null
          udl_benefit: string
          user_id: string
        }
        Insert: {
          activity_description?: string
          class_id?: string | null
          created_at?: string
          cultural_note?: string | null
          curriculum_topic_id?: string | null
          evidence_type?: string
          generated_adjustment?: string
          id?: string
          implemented_at?: string | null
          nccd_pillar?: string
          rationale?: string
          status?: string
          student_id: string
          teacher_action?: string | null
          trauma_note?: string | null
          udl_benefit?: string
          user_id: string
        }
        Update: {
          activity_description?: string
          class_id?: string | null
          created_at?: string
          cultural_note?: string | null
          curriculum_topic_id?: string | null
          evidence_type?: string
          generated_adjustment?: string
          id?: string
          implemented_at?: string | null
          nccd_pillar?: string
          rationale?: string
          status?: string
          student_id?: string
          teacher_action?: string | null
          trauma_note?: string | null
          udl_benefit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adjustments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjustments_curriculum_topic_id_fkey"
            columns: ["curriculum_topic_id"]
            isOneToOne: false
            referencedRelation: "curriculum_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjustments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_activity_events: {
        Row: {
          adjustment_id: string | null
          created_at: string
          duration_ms: number | null
          event_type: string
          id: string
          student_id: string | null
          success: boolean
          summary: string
          surface: string
          user_id: string
        }
        Insert: {
          adjustment_id?: string | null
          created_at?: string
          duration_ms?: number | null
          event_type?: string
          id?: string
          student_id?: string | null
          success?: boolean
          summary?: string
          surface?: string
          user_id: string
        }
        Update: {
          adjustment_id?: string | null
          created_at?: string
          duration_ms?: number | null
          event_type?: string
          id?: string
          student_id?: string | null
          success?: boolean
          summary?: string
          surface?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_activity_events_adjustment_id_fkey"
            columns: ["adjustment_id"]
            isOneToOne: false
            referencedRelation: "adjustments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_activity_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          name: string
          subject: string
          user_id: string
          year_level: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          subject: string
          user_id: string
          year_level?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          subject?: string
          user_id?: string
          year_level?: number
        }
        Relationships: []
      }
      curriculum_topics: {
        Row: {
          created_at: string
          description: string
          id: string
          sort_order: number
          strand: string
          subject: string
          topic: string
          user_id: string
          year_level: number
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          sort_order?: number
          strand: string
          subject: string
          topic: string
          user_id: string
          year_level?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          sort_order?: number
          strand?: string
          subject?: string
          topic?: string
          user_id?: string
          year_level?: number
        }
        Relationships: []
      }
      equity_flags: {
        Row: {
          category: string
          created_at: string
          detector: string
          excerpt: string
          id: string
          phrase: string
          reason: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          school_id: string | null
          severity: string
          status: string
          student_id: string | null
          surface: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          detector?: string
          excerpt?: string
          id?: string
          phrase?: string
          reason?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          school_id?: string | null
          severity?: string
          status?: string
          student_id?: string | null
          surface?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          detector?: string
          excerpt?: string
          id?: string
          phrase?: string
          reason?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          school_id?: string | null
          severity?: string
          status?: string
          student_id?: string | null
          surface?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equity_flags_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equity_flags_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_logs: {
        Row: {
          adjustment_id: string | null
          created_at: string
          evidence_summary: string
          id: string
          log_date: string
          pillar: string
          source: string
          student_id: string
          user_id: string
          week_number: number
        }
        Insert: {
          adjustment_id?: string | null
          created_at?: string
          evidence_summary?: string
          id?: string
          log_date?: string
          pillar?: string
          source?: string
          student_id: string
          user_id: string
          week_number?: number
        }
        Update: {
          adjustment_id?: string | null
          created_at?: string
          evidence_summary?: string
          id?: string
          log_date?: string
          pillar?: string
          source?: string
          student_id?: string
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "evidence_logs_adjustment_id_fkey"
            columns: ["adjustment_id"]
            isOneToOne: false
            referencedRelation: "adjustments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_events: {
        Row: {
          actor_id: string
          actor_name: string
          category: string
          created_at: string
          details: Json
          event_type: string
          id: string
          school_id: string | null
          summary: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          actor_id: string
          actor_name?: string
          category?: string
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          school_id?: string | null
          summary?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          actor_id?: string
          actor_name?: string
          category?: string
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          school_id?: string | null
          summary?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "governance_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_consent: boolean
          ai_consent_at: string | null
          assessment_context: string
          created_at: string
          full_name: string
          id: string
          role: string
          school_name: string
          state: string
          updated_at: string
          year_level: number
        }
        Insert: {
          ai_consent?: boolean
          ai_consent_at?: string | null
          assessment_context?: string
          created_at?: string
          full_name?: string
          id: string
          role?: string
          school_name?: string
          state?: string
          updated_at?: string
          year_level?: number
        }
        Update: {
          ai_consent?: boolean
          ai_consent_at?: string | null
          assessment_context?: string
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          school_name?: string
          state?: string
          updated_at?: string
          year_level?: number
        }
        Relationships: []
      }
      school_members: {
        Row: {
          active: boolean
          created_at: string
          school_id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          school_id: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_members_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          class_id: string
          created_at: string
          first_name: string
          id: string
          last_name: string
          preferred_name: string
          profile: Json
          sort_order: number
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          preferred_name: string
          profile?: Json
          sort_order?: number
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          preferred_name?: string
          profile?: Json
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_school_admin_of: {
        Args: { _admin: string; _target: string }
        Returns: boolean
      }
      user_school_id: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "teacher"
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
      app_role: ["admin", "teacher"],
    },
  },
} as const
