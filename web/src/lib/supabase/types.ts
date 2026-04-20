export type AgentStatus = 'online' | 'offline' | 'busy';
export type AgentApiMode = 'max' | 'byok';
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
  api_mode: AgentApiMode;
  agent_version: string | null;
  mac_address: string | null;
  local_ip: string | null;
  wake_request_at: string | null;
  wake_last_sent_at: string | null;
  task_timeout_minutes: number | null;
  created_at: string;
  /** UI-derived: 해당 에이전트의 가장 최근 대화 메시지 시각. DB 컬럼 아님. */
  last_activity_at?: string | null;
}

export type HarnessSource = 'scan' | 'manual';

export interface Harness {
  id: string;
  agent_id: string;
  user_id: string;
  name: string;
  path: string;
  description: string;
  content: string | null;
  score: number;
  features: string[];
  source: HarnessSource;
  created_at: string;
}

export type MessageReaction = 'up' | 'down' | 'curious';

export interface Message {
  id: string;
  agent_id: string;
  user_id: string;
  conversation_id: string;
  harness_id: string | null;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  error_message: string | null;
  pinned: boolean;
  pinned_at: string | null;
  reaction: MessageReaction | null;
  timeout_extended: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  agent_id: string;
  user_id: string;
  title: string;
  claude_session_id: string | null;
  archived: boolean;
  pinned: boolean;
  tags: string[];
  summary: string | null;
  summary_updated_at: string | null;
  timeout_override_minutes: number | null;
  last_message_at: string;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  prompt: string;
  category: string;
  sort_order: number;
  /** 시스템(전역) 템플릿은 null, 개인 템플릿은 소유자 UUID */
  user_id: string | null;
  is_system: boolean;
  recommended_for: string[];
  description: string | null;
  icon: string | null;
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
  conversation_id: string | null;
  message_id: string | null;
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

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  notify_on_complete: boolean;
  notify_on_error: boolean;
  notify_on_cancel: boolean;
  notify_daily_summary: boolean;
  last_used_at: string | null;
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
          api_mode?: AgentApiMode;
          agent_version?: string | null;
          mac_address?: string | null;
          local_ip?: string | null;
          wake_request_at?: string | null;
          wake_last_sent_at?: string | null;
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
          api_mode?: AgentApiMode;
          agent_version?: string | null;
          mac_address?: string | null;
          local_ip?: string | null;
          wake_request_at?: string | null;
          wake_last_sent_at?: string | null;
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
          content?: string | null;
          score?: number;
          features?: string[];
          source?: HarnessSource;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          user_id?: string;
          name?: string;
          path?: string;
          description?: string;
          content?: string | null;
          score?: number;
          features?: string[];
          source?: HarnessSource;
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
          conversation_id: string;
          harness_id?: string | null;
          role: MessageRole;
          content: string;
          status?: MessageStatus;
          error_message?: string | null;
          pinned?: boolean;
          pinned_at?: string | null;
          timeout_extended?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          user_id?: string;
          conversation_id?: string;
          harness_id?: string | null;
          role?: MessageRole;
          content?: string;
          status?: MessageStatus;
          error_message?: string | null;
          pinned?: boolean;
          pinned_at?: string | null;
          timeout_extended?: boolean;
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
          user_id?: string | null;
          is_system?: boolean;
          recommended_for?: string[];
          description?: string | null;
          icon?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          prompt?: string;
          category?: string;
          sort_order?: number;
          user_id?: string | null;
          is_system?: boolean;
          recommended_for?: string[];
          description?: string | null;
          icon?: string | null;
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
          conversation_id?: string | null;
          message_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          user_id?: string;
          level?: LogLevel;
          message?: string;
          conversation_id?: string | null;
          message_id?: string | null;
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
      conversations: {
        Row: Conversation;
        Insert: {
          id?: string;
          agent_id: string;
          user_id: string;
          title?: string;
          claude_session_id?: string | null;
          archived?: boolean;
          tags?: string[];
          summary?: string | null;
          summary_updated_at?: string | null;
          last_message_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          user_id?: string;
          title?: string;
          claude_session_id?: string | null;
          archived?: boolean;
          tags?: string[];
          summary?: string | null;
          summary_updated_at?: string | null;
          last_message_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
        ];
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
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}
