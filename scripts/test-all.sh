#!/bin/bash

echo "🚀 Starting Complete Test Suite..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2 PASSED${NC}"
    else
        echo -e "${RED}❌ $2 FAILED${NC}"
        exit 1
    fi
}

# Step 1: Type Check
echo -e "${YELLOW}📝 Running TypeScript type check...${NC}"
npm run type-check
print_status $? "Type Check"

# Step 2: Linting
echo -e "${YELLOW}🔍 Running ESLint...${NC}"
npm run lint
print_status $? "Linting"

# Step 3: Unit Tests
echo -e "${YELLOW}🧪 Running Unit Tests...${NC}"
npm run test
print_status $? "Unit Tests"

# Step 4: Build Check
echo -e "${YELLOW}🏗️ Running Build Check...${NC}"
npm run build
print_status $? "Build"

# Step 5: E2E Tests
echo -e "${YELLOW}🎭 Running E2E Tests...${NC}"
npm run test:e2e
print_status $? "E2E Tests"

echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
echo "=================================="