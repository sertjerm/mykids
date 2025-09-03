#!/bin/bash

# MyKids Rollback Script
echo "🔄 กำลัง rollback MyKids..."

if [ -d "./mykids-backup-20250903-091052" ]; then
    echo "📁 กู้คืนไฟล์จาก backup..."
    
    # Restore files
    [ -f "./mykids-backup-20250903-091052/useMyKidsStore.js" ] && cp "./mykids-backup-20250903-091052/useMyKidsStore.js" "src/stores/"
    [ -f "./mykids-backup-20250903-091052/App.jsx.original" ] && cp "./mykids-backup-20250903-091052/App.jsx.original" "src/App.jsx"
    
    # Remove new files
    rm -rf "src/services"
    rm -rf "src/components/migration"
    rm -rf "src/config"
    rm -f "test-mykids-api.js"
    
    echo "✅ Rollback เสร็จสิ้น"
else
    echo "❌ ไม่พบ backup directory: ./mykids-backup-20250903-091052"
fi
