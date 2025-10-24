#!/bin/bash
# Professional Code Cleanup - Remove Emojis from Source Code
# This script removes all emojis from source files for professional presentation

echo "Starting emoji cleanup..."

# List of common emojis to remove from console.log and comments
# Using sed to replace emojis with empty string or descriptive text

find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i '' \
  -e 's/🚀/INIT/g' \
  -e 's/✅/SUCCESS/g' \
  -e 's/❌/ERROR/g' \
  -e 's/⚠️/WARNING/g' \
  -e 's/🔍/SEARCH/g' \
  -e 's/📊/DATA/g' \
  -e 's/📈/STATS/g' \
  -e 's/💻/DEV/g' \
  -e 's/🔥/HOT/g' \
  -e 's/🎯/TARGET/g' \
  -e 's/📦/PACKAGE/g' \
  -e 's/🎭/DEMO/g' \
  -e 's/🏗️/BUILD/g' \
  -e 's/🔐/SECURITY/g' \
  -e 's/🌍/GLOBAL/g' \
  -e 's/💾/SAVE/g' \
  -e 's/🗄️/DATABASE/g' \
  -e 's/⚡/FAST/g' \
  -e 's/🧪/TEST/g' \
  -e 's/📝/NOTE/g' \
  -e 's/🎉/COMPLETE/g' \
  -e 's/💎/PREMIUM/g' \
  -e 's/🏆/WIN/g' \
  -e 's/⭐/STAR/g' \
  -e 's/✨/SPARKLE/g' \
  -e 's/🚨/ALERT/g' \
  -e 's/⏱️/TIMER/g' \
  -e 's/🔄/REFRESH/g' \
  -e 's/♿/ACCESS/g' \
  -e 's/📱/MOBILE/g' \
  -e 's/🌐/WEB/g' \
  -e 's/🎨/STYLE/g' \
  -e 's/📄/DOC/g' \
  -e 's/🔧/TOOL/g' \
  -e 's/⚙️/CONFIG/g' \
  -e 's/🐛/BUG/g' \
  -e 's/🔗/LINK/g' \
  -e 's/📞/CALL/g' \
  -e 's/💬/CHAT/g' \
  -e 's/📧/EMAIL/g' \
  -e 's/🏠/HOME/g' \
  -e 's/👨‍💼/ADMIN/g' \
  -e 's/👥/USERS/g' \
  -e 's/📅/CALENDAR/g' \
  -e 's/🔔/NOTIFY/g' \
  -e 's/💡/IDEA/g' \
  -e 's/🎬/ACTION/g' \
  -e 's/📢/ANNOUNCE/g' \
  -e 's/🛠️/MAINTAIN/g' \
  -e 's/🚧/WIP/g' \
  -e 's/⛔/BLOCKED/g' \
  -e 's/🌟/FEATURED/g' \
  -e 's/🎓/LEARN/g' \
  -e 's/📖/READ/g' \
  -e 's/🔑/KEY/g' \
  -e 's/🎁/GIFT/g' \
  -e 's/🏃/RUN/g' \
  -e 's/⏳/WAIT/g' \
  -e 's/💪/STRONG/g' \
  -e 's/🚪/EXIT/g' \
  -e 's/🌟/HIGHLIGHT/g' \
  {} \;

echo "Emoji cleanup complete!"
echo "Replaced emojis with descriptive text in all source files."

