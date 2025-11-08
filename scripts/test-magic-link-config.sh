#!/bin/bash

# Script to test Magic Link configuration
# Author: FastRezu Team
# Date: 2025-11-08

echo "======================================"
echo "FastRezu Magic Link Configuration Test"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check environment variables
echo "1. Checking environment variables..."
echo ""

if [ -f .env.local ]; then
    echo -e "${GREEN}✓${NC} .env.local file exists"
    
    if grep -q "NEXT_PUBLIC_SITE_URL" .env.local; then
        SITE_URL=$(grep "NEXT_PUBLIC_SITE_URL" .env.local | cut -d '=' -f2)
        echo -e "${GREEN}✓${NC} NEXT_PUBLIC_SITE_URL is set: $SITE_URL"
    else
        echo -e "${RED}✗${NC} NEXT_PUBLIC_SITE_URL is not set"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo -e "${GREEN}✓${NC} NEXT_PUBLIC_SUPABASE_URL is set"
    else
        echo -e "${RED}✗${NC} NEXT_PUBLIC_SUPABASE_URL is not set"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo -e "${GREEN}✓${NC} NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
    else
        echo -e "${RED}✗${NC} NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
    fi
else
    echo -e "${RED}✗${NC} .env.local file not found"
fi

echo ""
echo "2. Checking required files..."
echo ""

# Check if required files exist
FILES=(
    "src/app/login/page.tsx"
    "src/app/auth/callback/route.ts"
    "src/app/auth/confirm/route.ts"
    "src/middleware.ts"
    "src/lib/supabase-client.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file is missing"
    fi
done

echo ""
echo "3. Checking authentication routes..."
echo ""

# Check if auth routes are properly configured
if [ -f "src/app/auth/callback/route.ts" ]; then
    if grep -q "exchangeCodeForSession" "src/app/auth/callback/route.ts"; then
        echo -e "${GREEN}✓${NC} OAuth callback route is configured"
    else
        echo -e "${YELLOW}⚠${NC} OAuth callback might need verification"
    fi
fi

if [ -f "src/app/auth/confirm/route.ts" ]; then
    if grep -q "verifyOtp" "src/app/auth/confirm/route.ts"; then
        echo -e "${GREEN}✓${NC} PKCE confirm route is configured"
    else
        echo -e "${YELLOW}⚠${NC} PKCE confirm route might need verification"
    fi
fi

echo ""
echo "4. Checking middleware configuration..."
echo ""

if [ -f "src/middleware.ts" ]; then
    if grep -q "sameSite" "src/middleware.ts"; then
        echo -e "${GREEN}✓${NC} Cookie sameSite is configured"
    else
        echo -e "${YELLOW}⚠${NC} Cookie sameSite might need to be set"
    fi
    
    if grep -q "secure" "src/middleware.ts"; then
        echo -e "${GREEN}✓${NC} Cookie secure flag is configured"
    else
        echo -e "${YELLOW}⚠${NC} Cookie secure flag might need to be set"
    fi
fi

echo ""
echo "5. Manual checks required in Supabase Dashboard:"
echo ""
echo -e "${YELLOW}→${NC} Go to Authentication > URL Configuration"
echo -e "${YELLOW}→${NC} Add redirect URLs:"
if [ ! -z "$SITE_URL" ]; then
    echo "   - $SITE_URL/auth/callback"
    echo "   - $SITE_URL/auth/confirm"
else
    echo "   - YOUR_SITE_URL/auth/callback"
    echo "   - YOUR_SITE_URL/auth/confirm"
fi
echo ""
echo -e "${YELLOW}→${NC} Set Site URL to: $SITE_URL"
echo ""
echo -e "${YELLOW}→${NC} Optional: Update Magic Link email template to use:"
echo "   /auth/confirm?token_hash={{ .TokenHash }}&type=email"

echo ""
echo "======================================"
echo "Test Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Update Supabase Dashboard settings (see above)"
echo "2. Deploy to staging/production for mobile testing"
echo "3. Test magic link flow on mobile device"
echo ""
echo "For detailed documentation, see:"
echo "docs/MAGIC_LINK_MOBILE_FIX.md"
echo ""
