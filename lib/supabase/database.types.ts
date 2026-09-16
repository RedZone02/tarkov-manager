type GameModeColumn = 'regular' | 'pve';
type FactionColumn = 'BEAR' | 'USEC';

export type Database = {
  public: {
    Tables: {
      player_settings: {
        Row: {
          user_id: string;
          mode: GameModeColumn;
          player_level: number;
          faction: FactionColumn;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          mode: GameModeColumn;
          player_level?: number;
          faction?: FactionColumn;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          mode?: GameModeColumn;
          player_level?: number;
          faction?: FactionColumn;
          updated_at?: string;
        };
        Relationships: [];
      };
      completed_quests: {
        Row: {
          user_id: string;
          mode: GameModeColumn;
          task_id: string;
          completed_at: string;
        };
        Insert: {
          user_id: string;
          mode: GameModeColumn;
          task_id: string;
          completed_at?: string;
        };
        Update: {
          user_id?: string;
          mode?: GameModeColumn;
          task_id?: string;
          completed_at?: string;
        };
        Relationships: [];
      };
      hideout_levels: {
        Row: {
          user_id: string;
          mode: GameModeColumn;
          station_id: string;
          level: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          mode: GameModeColumn;
          station_id: string;
          level: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          mode?: GameModeColumn;
          station_id?: string;
          level?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      raid_logs: {
        Row: {
          id: string;
          user_id: string;
          mode: GameModeColumn;
          map_name: string;
          survived: boolean;
          total_cost: number;
          total_loot: number;
          item_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mode: GameModeColumn;
          map_name: string;
          survived: boolean;
          total_cost?: number;
          total_loot?: number;
          item_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mode?: GameModeColumn;
          map_name?: string;
          survived?: boolean;
          total_cost?: number;
          total_loot?: number;
          item_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
