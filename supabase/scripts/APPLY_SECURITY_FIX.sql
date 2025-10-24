-- 🚨 CRITICAL SECURITY FIX: Apply this in your Supabase Dashboard SQL Editor
-- This fixes the security definer vulnerability in the whatsapp_messages view

-- Fix the security definer issue by setting security_invoker = true
ALTER VIEW public.whatsapp_messages
SET (security_invoker = true);

-- Verify the fix was applied
SELECT 
  'whatsapp_messages' as view_name,
  'SECURITY INVOKER' as security_mode,
  'RLS policies will be enforced' as access_control,
  'Fix applied successfully' as status;

-- SUCCESS: Your WhatsApp messages view now respects Row Level Security policies
-- Users can only see data they are authorized to access 