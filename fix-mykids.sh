#!/bin/bash

# Fix Tailwind PostCSS Issue for MyKids Project
# วิธีแก้ปัญหา Tailwind CSS PostCSS plugin

set -e

# สีสำหรับ output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "\n${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}💡 $1${NC}"
}

# ตรวจสอบว่าอยู่ในโฟลเดอร์โปรเจ็คหรือไม่
if [[ ! -f "package.json" ]]; then
    print_error "ไม่พบ package.json กรุณารันใน directory โปรเจ็ค"
    echo "ใช้คำสั่ง: cd mykids && ./fix-tailwind.sh"
    exit 1
fi

print_step "แก้ไขปัญหา Tailwind CSS PostCSS..."

# ลบ node_modules และ package-lock.json
print_step "ลบ cache และ dependencies เก่า..."
rm -rf node_modules package-lock.json

# ติดตั้ง Tailwind CSS version ที่เข้ากันได้
print_step "ติดตั้ง Tailwind CSS version ที่ถูกต้อง..."
npm install -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0

# สร้าง PostCSS config ใหม่
print_step "สร้าง PostCSS configuration ใหม่..."
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# อัปเดต Tailwind config
print_step "อัปเดต Tailwind configuration..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rainbow: {
          red: '#FFB3B3',
          orange: '#FFCCB3', 
          yellow: '#FFFFB3',
          green: '#B3FFB3',
          mint: '#B3FFCC',
          cyan: '#B3FFFF',
          blue: '#B3E5FF',
          indigo: '#B3CCFF',
          purple: '#CCB3FF',
          pink: '#FFB3E6'
        }
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      }
    },
  },
  plugins: [],
}
EOF

# ติดตั้ง dependencies ใหม่
print_step "ติดตั้ง dependencies..."
npm install

# ทดสอบ build
print_step "ทดสอบ build..."
if npm run build; then
    print_success "🎉 Build สำเร็จแล้ว!"
    
    # แสดงสรุปการแก้ไข
    print_step "สรุปการแก้ไข..."
    echo -e "${GREEN}✅${NC} แก้ไข PostCSS configuration"
    echo -e "${GREEN}✅${NC} อัปเดต Tailwind CSS configuration"  
    echo -e "${GREEN}✅${NC} ติดตั้ง dependencies ใหม่"
    echo -e "${GREEN}✅${NC} Build ผ่านเรียบร้อย"
    
    print_info "🌈 โปรเจ็ค MyKids พร้อมใช้งานแล้ว!"
    echo -e "${BLUE}📂 URL:${NC} http://localhost:5173"
    echo -e "${BLUE}🎯 Features:${NC} Rainbow theme, Multi-child tracking, Points system"
    
    print_step "เริ่ม development server..."
    echo -e "${YELLOW}💡 กด Ctrl+C เพื่อหยุด server${NC}"
    sleep 2
    npm run dev
    
else
    print_error "ยังมีปัญหาอยู่ ลองแก้ไขแบบ manual"
    
    print_info "วิธีแก้แบบ manual:"
    echo "1. ลบไฟล์ postcss.config.js"
    echo "2. สร้างไฟล์ postcss.config.cjs แทน:"
    echo ""
    echo "module.exports = {"
    echo "  plugins: {"
    echo "    tailwindcss: {},"
    echo "    autoprefixer: {},"
    echo "  },"
    echo "}"
    echo ""
    echo "3. รัน npm run build อีกครั้ง"
    
    print_info "หรือลองวิธีอื่น:"
    echo "4. npm install -D @tailwindcss/postcss"
    echo "5. อัปเดต package.json dependencies"
    
    exit 1
fi

# สรุปสุดท้าย (กรณี server หยุดทำงาน)
print_info "🎉 ขอบคุณที่ใช้ MyKids Setup Script!"
echo -e "${BLUE}📖 Documentation:${NC} README.md"
echo -e "${BLUE}🔧 รัน dev อีกครั้ง:${NC} npm run dev"
echo -e "${BLUE}🏗️ Build production:${NC} npm run build"