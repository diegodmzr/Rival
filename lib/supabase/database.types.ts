// Hand-written types mirroring `supabase/migrations/0001_init.sql`.
// Regenerate with `supabase gen types typescript --project-id <ref>` once the CLI is linked.

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          initials: string;
          weekly_goal_hours: number;
          monthly_goal_hours: number;
          avatar_url: string | null;
          rest_day_weekday: number | null;
          rest_day_max_hours: number;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          initials: string;
          weekly_goal_hours?: number;
          monthly_goal_hours?: number;
          avatar_url?: string | null;
          rest_day_weekday?: number | null;
          rest_day_max_hours?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          initials?: string;
          weekly_goal_hours?: number;
          monthly_goal_hours?: number;
          avatar_url?: string | null;
          rest_day_weekday?: number | null;
          rest_day_max_hours?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          created_by: string;
          is_personal: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          created_by: string;
          is_personal?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          created_by?: string;
          is_personal?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      time_entries: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          hours: number;
          date: string;
          note: string;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          hours: number;
          date: string;
          note?: string;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          hours?: number;
          date?: string;
          note?: string;
          category?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "time_entries_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "time_entries_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      day_recaps: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          note: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "day_recaps_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      active_timers: {
        Row: {
          user_id: string;
          project_id: string | null;
          started_at: string | null;
          elapsed_base_sec: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          project_id?: string | null;
          started_at?: string | null;
          elapsed_base_sec?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          project_id?: string | null;
          started_at?: string | null;
          elapsed_base_sec?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "active_timers_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "active_timers_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      resources: {
        Row: {
          id: string;
          kind: "youtube" | "pdf";
          title: string;
          description: string;
          category: string;
          url: string;
          youtube_id: string | null;
          thumbnail_url: string | null;
          added_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          kind: "youtube" | "pdf";
          title: string;
          description?: string;
          category?: string;
          url: string;
          youtube_id?: string | null;
          thumbnail_url?: string | null;
          added_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          kind?: "youtube" | "pdf";
          title?: string;
          description?: string;
          category?: string;
          url?: string;
          youtube_id?: string | null;
          thumbnail_url?: string | null;
          added_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resources_added_by_fkey";
            columns: ["added_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      resource_views: {
        Row: {
          resource_id: string;
          user_id: string;
          status: "watched" | "rewatch";
          updated_at: string;
        };
        Insert: {
          resource_id: string;
          user_id: string;
          status: "watched" | "rewatch";
          updated_at?: string;
        };
        Update: {
          resource_id?: string;
          user_id?: string;
          status?: "watched" | "rewatch";
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resource_views_resource_id_fkey";
            columns: ["resource_id"];
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resource_views_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type TimeEntryRow = Database["public"]["Tables"]["time_entries"]["Row"];
