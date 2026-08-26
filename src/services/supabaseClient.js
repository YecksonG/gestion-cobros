import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mirtrljyqyvlgwngxpiq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcnRybGp5cXl2bGd3bmd4cGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODM2MTIsImV4cCI6MjEwMjU1OTYxMn0.oQmPos1oOfwJpVRS1ygqSB6mfMt1iM1_US6kdgqDYq8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
