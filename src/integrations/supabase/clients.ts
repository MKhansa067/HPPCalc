import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://iogiqjvaccrfrlfcbeqe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZ2lxanZhY2NyZnJsZmNiZXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NDY3ODMsImV4cCI6MjA4MDIyMjc4M30.LFt2YBrF376J8g3vOXDQGPfL-AGtT5c3LMl8eWd2Hr0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
