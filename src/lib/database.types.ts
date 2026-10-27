// Generated from the Supabase schema (supabase/migrations). Regenerate after schema changes.
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      household_members: {
        Row: {
          display_name: string;
          household_id: string;
          joined_at: string;
          user_id: string;
        };
        Insert: {
          display_name: string;
          household_id: string;
          joined_at?: string;
          user_id: string;
        };
        Update: {
          display_name?: string;
          household_id?: string;
          joined_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'household_members_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      household_products: {
        Row: {
          barcode: string;
          household_id: string;
          name: string;
          section_id: string;
          sticker: string;
          unit: string;
          updated_at: string;
        };
        Insert: {
          barcode: string;
          household_id: string;
          name: string;
          section_id: string;
          sticker: string;
          unit?: string;
          updated_at?: string;
        };
        Update: {
          barcode?: string;
          household_id?: string;
          name?: string;
          section_id?: string;
          sticker?: string;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'household_products_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      households: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          invite_code: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string;
          id?: string;
          invite_code?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          invite_code?: string;
          name?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          added_by: string | null;
          added_by_name: string;
          added_on: string;
          barcode: string | null;
          created_at: string;
          expires_on: string | null;
          household_id: string;
          id: string;
          name: string;
          quantity: number;
          section_id: string;
          sticker: string;
          unit: string;
          updated_at: string;
        };
        Insert: {
          added_by?: string | null;
          added_by_name?: string;
          added_on?: string;
          barcode?: string | null;
          created_at?: string;
          expires_on?: string | null;
          household_id: string;
          id?: string;
          name: string;
          quantity?: number;
          section_id: string;
          sticker: string;
          unit?: string;
          updated_at?: string;
        };
        Update: {
          added_by?: string | null;
          added_by_name?: string;
          added_on?: string;
          barcode?: string | null;
          created_at?: string;
          expires_on?: string | null;
          household_id?: string;
          id?: string;
          name?: string;
          quantity?: number;
          section_id?: string;
          sticker?: string;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'items_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_household: {
        Args: { household_name: string; member_name: string };
        Returns: {
          created_at: string;
          created_by: string;
          id: string;
          invite_code: string;
          name: string;
        };
        SetofOptions: {
          from: '*';
          to: 'households';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      is_household_member: { Args: { target: string }; Returns: boolean };
      join_household: {
        Args: { code: string; member_name: string };
        Returns: {
          created_at: string;
          created_by: string;
          id: string;
          invite_code: string;
          name: string;
        };
        SetofOptions: {
          from: '*';
          to: 'households';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
