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
          storage_path: string | null;
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
          storage_path?: string | null;
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
          storage_path?: string | null;
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
      tasks: {
        Row: {
          id: string;
          project_id: string | null;
          parent_task_id: string | null;
          title: string;
          description: string;
          status: "todo" | "in_progress" | "done";
          priority: "low" | "normal" | "high";
          due_date: string | null;
          assigned_user_id: string | null;
          created_by: string;
          completed_by: string | null;
          completed_at: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          parent_task_id?: string | null;
          title: string;
          description?: string;
          status?: "todo" | "in_progress" | "done";
          priority?: "low" | "normal" | "high";
          due_date?: string | null;
          assigned_user_id?: string | null;
          created_by: string;
          completed_by?: string | null;
          completed_at?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          parent_task_id?: string | null;
          title?: string;
          description?: string;
          status?: "todo" | "in_progress" | "done";
          priority?: "low" | "normal" | "high";
          due_date?: string | null;
          assigned_user_id?: string | null;
          created_by?: string;
          completed_by?: string | null;
          completed_at?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey";
            columns: ["parent_task_id"];
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_assigned_user_id_fkey";
            columns: ["assigned_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_completed_by_fkey";
            columns: ["completed_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      task_attachments: {
        Row: {
          id: string;
          task_id: string;
          kind: "file" | "link";
          name: string;
          url: string;
          storage_path: string | null;
          size_bytes: number | null;
          mime: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          kind: "file" | "link";
          name: string;
          url: string;
          storage_path?: string | null;
          size_bytes?: number | null;
          mime?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          kind?: "file" | "link";
          name?: string;
          url?: string;
          storage_path?: string | null;
          size_bytes?: number | null;
          mime?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey";
            columns: ["task_id"];
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_attachments_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      entry_tasks: {
        Row: {
          entry_id: string;
          task_id: string;
          created_at: string;
        };
        Insert: {
          entry_id: string;
          task_id: string;
          created_at?: string;
        };
        Update: {
          entry_id?: string;
          task_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entry_tasks_entry_id_fkey";
            columns: ["entry_id"];
            referencedRelation: "time_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entry_tasks_task_id_fkey";
            columns: ["task_id"];
            referencedRelation: "tasks";
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
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type EntryTaskRow = Database["public"]["Tables"]["entry_tasks"]["Row"];
export type TaskAttachmentRow = Database["public"]["Tables"]["task_attachments"]["Row"];
