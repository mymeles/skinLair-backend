#!/bin/bash

# Comprehensive Booking Flow Test Runner
# This script runs all tests for the booking system

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     SKIN LAIR BOOKING SYSTEM - COMPREHENSIVE TESTS         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "TEST: $test_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if eval "$test_command"; then
        print_success "$test_name passed"
        ((TESTS_PASSED++))
        return 0
    else
        print_error "$test_name failed"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Check if backend is running
echo "Checking prerequisites..."
echo ""

if curl -s http://localhost:9000/health > /dev/null 2>&1; then
    print_success "Backend is running on port 9000"
else
    print_error "Backend is not running on port 9000"
    print_info "Please start the backend with: cd skinLair && npm run dev"
    exit 1
fi

# Check if Node.js is available
if command -v node &> /dev/null; then
    print_success "Node.js is installed ($(node --version))"
else
    print_error "Node.js is not installed"
    exit 1
fi

# Check if required files exist
if [ -f "quick-test.mjs" ]; then
    print_success "Test files found"
else
    print_error "Test files not found"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    RUNNING TESTS                           ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Test 1: Quick API Test
run_test "Quick API Test" "node quick-test.mjs"

# Test 2: Health Check
run_test "Backend Health Check" "curl -sf http://localhost:9000/health > /dev/null"

# Test 3: Services Endpoint
run_test "Services Endpoint" "curl -sf -H 'x-publishable-api-key: pk_test_01JGQXQXQXQXQXQXQXQXQX' http://localhost:9000/store/services > /dev/null"

# Print summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    TEST SUMMARY                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Total Tests Run: $((TESTS_PASSED + TESTS_FAILED))"
print_success "Passed: $TESTS_PASSED"

if [ $TESTS_FAILED -gt 0 ]; then
    print_error "Failed: $TESTS_FAILED"
    echo ""
    print_warning "Some tests failed. Please check the output above for details."
    exit 1
else
    print_success "Failed: $TESTS_FAILED"
    echo ""
    print_success "All tests passed! ✨"
    echo ""
    print_info "Next steps:"
    echo "  1. Start the frontend: cd skinLair-storefront && npm run dev"
    echo "  2. Open http://localhost:8000/services in your browser"
    echo "  3. Test the booking flow manually"
    echo "  4. Use Stripe test card: 4242 4242 4242 4242"
    echo ""
fi

