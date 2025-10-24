#!/bin/bash

# 🚨 Apply Messages Database Fix
# This script guides you through fixing the messages loading issues

echo "🚀 OvenAI Messages Database Fix Script"
echo "======================================"
echo ""

echo "📋 Issues Being Fixed:"
echo "  1. Missing WhatsApp columns in conversations table"
echo "  2. Missing whatsapp_messages view"
echo "  3. RLS policies preventing message access"
echo "  4. Sample data for testing"
echo ""

echo "📍 SQL Script Location: scripts/fixes/fix-messages-database-structure.sql"
echo ""

echo "🔧 How to Apply This Fix:"
echo "  1. Open your Supabase Dashboard"
echo "  2. Go to SQL Editor"
echo "  3. Copy the contents of fix-messages-database-structure.sql"
echo "  4. Paste and run the SQL script"
echo "  5. Verify the results in the output"
echo ""

echo "⚠️  Database Changes:"
echo "  ✅ Adds missing columns to conversations table (safe operation)"
echo "  ✅ Creates whatsapp_messages view (backward compatibility)"
echo "  ✅ Updates RLS policies (temporary - permissive for debugging)"
echo "  ✅ Inserts sample Hebrew WhatsApp messages for testing"
echo ""

echo "🧪 After running the SQL script, restart your development server:"
echo "  npm run dev"
echo ""

echo "🔍 Expected Results:"
echo "  ✅ Messages page will show conversations with message counts"
echo "  ✅ Console will show '💬 Loaded X validated messages for [Name]'"
echo "  ✅ No more 400 API errors"
echo "  ✅ WhatsApp messages visible in the table"
echo ""

echo "📊 To verify the fix worked, check the SQL output for:"
echo "  - conversations_table: total_records, whatsapp_messages count"
echo "  - whatsapp_messages_view: should match conversations count"
echo "  - Sample data showing Hebrew messages"
echo ""

echo "🔧 Ready to apply? Copy this file path:"
echo "$(cd "$(dirname "$0")" && pwd)/fix-messages-database-structure.sql"
echo ""

# Check if Supabase CLI is available for direct execution
if command -v supabase &> /dev/null; then
    echo "📡 Supabase CLI detected. Alternative: Run directly with:"
    echo "supabase db reset --local  # if using local development"
    echo "or apply the SQL manually in Supabase Dashboard"
else
    echo "📡 Apply manually in Supabase Dashboard SQL Editor"
fi

echo ""
echo "🎯 Next Steps After SQL Fix:"
echo "  1. Apply the SQL script in Supabase"
echo "  2. Restart development server"
echo "  3. Check Messages page for loaded conversations"
echo "  4. Verify Hebrew sample messages appear"
echo "" 