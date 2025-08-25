// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Your Supabase URL and anon Key from the file you provided
const supabaseUrl = 'https://ecvrdcijhdhobjtbtrcl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjdnJkY2lqaGRob2JqdGJ0cmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNTU0NjksImV4cCI6MjA2NDkzMTQ2OX0.RhVhDm6MRreFsmbex_QVwiE08unLLb6wYjsH1FVAGVg'

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
