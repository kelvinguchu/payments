export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_balances: {
        Row: {
          id: string;
          total_amount: number;
          pending_amount: number;
          completed_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          total_amount?: number;
          pending_amount?: number;
          completed_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          total_amount?: number;
          pending_amount?: number;
          completed_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          amount: number;
          status: "completed" | "pending" | "failed";
          description: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          amount: number;
          status: "completed" | "pending" | "failed";
          description: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          amount?: number;
          status?: "completed" | "pending" | "failed";
          description?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
