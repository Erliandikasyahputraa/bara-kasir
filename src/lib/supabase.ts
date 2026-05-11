import { createClient } from '@supabase/supabase-js';

// Supabase Configuration for Bara Kasir
const supabaseUrl = 'https://qbqodyumkmcwovbujeki.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFicW9keXVta21jd292YnVqZWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTQyMDEsImV4cCI6MjA5NDA5MDIwMX0.TtAzFyK6kNgL1Bengw81yJu_sDXowjOdEfoQxD6CVac';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
