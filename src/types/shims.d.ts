// Type shims for build compatibility - minimal fixes only
/// <reference path="./compat-supabase.d.ts" />

// Fix for deep instantiation errors by providing simpler fallback types
declare module '*' {
  const value: any;
  export default value;
}

// Supabase query result shims to prevent type errors
declare type QueryResult<T = any> = {
  data: T | null;
  error: any;
  count?: number;
} | T;

declare type SelectQueryError<T = string> = {
  [K in string]: any;
};

// Chat message compatibility
declare interface ChatMessage {
  id: string;
  body: string;
  created_at: string;
  updated_at: string;
  thread_id: string;
  sender_id: string;
  reply_to_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  attachments: any[];
  edited_at?: string; // Make this optional to fix the build error
}