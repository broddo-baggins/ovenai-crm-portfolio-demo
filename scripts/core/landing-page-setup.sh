#!/bin/bash

# 🚀 AI Landing Page Setup Script
echo "🎯 Setting up AI Real Estate Landing Page..."
echo "============================================="

# 1. Install new dependencies
echo "📦 Installing required dependencies..."
npm install lottie-react gsap @tabler/icons-react

# 2. Create folder structure
echo "📁 Creating component structure..."

# Landing page components
mkdir -p src/components/landing/hero
mkdir -p src/components/landing/demo
mkdir -p src/components/landing/animations
mkdir -p src/components/landing/effects
mkdir -p src/components/landing/sections
mkdir -p src/components/landing/mockups

# Assets and animations
mkdir -p src/assets/animations
mkdir -p src/assets/devices
mkdir -p src/assets/landing

# Page directory
mkdir -p src/pages/landing

# Styles
mkdir -p src/styles/landing

echo "✅ Folder structure created!"
echo "📦 Dependencies installed!"
echo ""
echo "🚀 Next Steps:"
echo "1. Create components using the plan guidelines"
echo "2. Start development: npm run dev"
echo "3. Follow the phases in AI_LANDING_PAGE_PROPAGATION_PLAN.md"
echo ""
echo "Happy coding! 🎉"
