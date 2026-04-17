export type AgentStatus = 'online' | 'offline' | 'busy';
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'pending' | 'streaming' | 'completed' | 'error' | 'cancelled' | 'processing';
export type LogLevel = 'info' | 'warn' | 'error';

export interface Agent {
  id: string;
  name: string;
  api_key: string;
  status: AgentStatus;
  last_heartbeat: string | null;
  system_info: Record<string, unknown>;
  user_id: string;
  restart_requested: boolean;
  webhook_url: string | null;
  created_at: string;
}

export interface Harness {
  id: string;
  agent_id: string;
  user_id: string;
  name: string;
  path: string;
  description: string;
  created_at: string;
}

export interface Message {
  id: string;
  agent_id: string;
  user_id: string;
  harness_id: string | null;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  prompt: string;
  category: string;
  sort_order: number;
  user_id: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  agent_id: string;
  user_id: string;
  prompt: string;
  cron_expression: string;
  enabled: boolean;
  next_run: string | null;
  last_run: string | null;
  created_at: string;
}

export interface AgentLog {
  id: string;
  agent_id: string;
  user_id: string;
  level: LogLevel;
  message: string;
  created_at: string;
}

export interface InstallToken {
  id: string;
  token: string;
  pc_name: string;
  api_key: string;
  user_id: string;
  used: boolean;
  expires_at: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: Agent;
        Insert: {
          id?: string;
          name: string;
          api_key: string;
          status?: AgentStatus;
          last_heartbeat?: string | null;
          system_info?: Record<string, unknown>;
          user_id: string;
          restart_requested?: boolean;
          webhook_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          api_key?: string;
          status?: AgentStatus;
          last_heartbeat?: string | null;
          system_info?: Record<string, unknown>;
          user_id?: string;
          restart_requested?: boolean;
          webhook_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      harnesses: {
        Row: Harness;
        Insert: {
          id?: string;
          agent_id: string;
          user_id: string;
          name: string;
          path: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          user_id?: string;
          name?: string;
          path?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'harnesses_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: Message;
        Insert: {
          id?: string;
          agent_id: string;
          user_id: string;
          harness_id?: string | null;
          role: MessageRole;
          content: string;
          status?: MessageStatus;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          user_id?: string;
          harness_id?: string | null;
          role?: MessageRole;
          content?: string;
          status?: MessageStatus;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_harness_id_fkey';
            columns: ['harness_id'];
            isOneToOne: false;
            referencedRelation: 'harnesses';
            referencedColumns: ['id'];
          },
        ];
      };
      templates: {
        Row: Template;
        Insert: {
          id?: string;
          name: string;
          prompt: string;
          category?: string;
          sort_order?: number;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          prompt?: string;
          category?: string;
          sort_order?: number;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      schedules: {
        Row: Schedule;
        Insert: {
          id?: string;
          agent_id: string;
          user_id: string;
          prompt: string;
          cron_expression: string;
          enabled?: boolean;
          next_run?: string | null;
          last_run?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          user_id?: string;
          prompt?: string;
          cron_expression?: string;
          enabled?: boolean;
          next_run?: string | null;
          last_run?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'schedules_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
        ];
      };
      agent_logs: {
        Row: AgentLog;
        Insert: {
          id?: string;
          agent_id: string;
          user_id: string;
          level?: LogLevel;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          user_id?: string;
          level?: LogLevel;
          message?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'agent_logs_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
        ];
      };
      install_tokens: {
        Row: InstallToken;
        Insert: {
          id?: string;
          token: string;
          pc_name: string;
          api_key: string;
          user_id: string;
          used?: boolean;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          token?: string;
          pc_name?: string;
          api_key?: string;
          user_id?: string;
          used?: boolean;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: UserProfile;
        Insert: {
          id: string;
          display_name?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
