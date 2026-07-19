// ============================================================
// NailDesk — Supabase Connection
// ============================================================

const SUPABASE_URL = 'https://ebedsgokiryiwkvlblrs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZWRzZ29raXJ5aXdrdmxibHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MzM2MDksImV4cCI6MjEwMDAwOTYwOX0.beOHeJNZYWxgjOBmXnccVFCx9Y_z0RaH9q1vd6jnO9g';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
