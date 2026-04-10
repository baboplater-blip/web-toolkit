export type AgentStatus = 'online' | 'offline' | 'busy';
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'pending' | 'streaming' | 'completed' | 'error' | 'cancelled';

export interface Agent {
  id: string;
  name: string;
  api_key: string;
  status: AgentStatus;
  last_heartbeat: string | null;
  system_info: Record<string, unknown>;
  created_at: string;
}

export interface Harness {
  id: string;
  agent_id: string;
  name: string;
  path: string;
  description: string;
  created_at: string;
}

export interface Message {
  id: string;
  agent_id: string;
  harness_id: string | null;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
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
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          api_key?: string;
          status?: AgentStatus;
          last_heartbeat?: string | null;
          system_info?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
      harnesses: {
        Row: Harness;
        Insert: {
          id?: string;
          agent_id: string;
          name: string;
          path: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
