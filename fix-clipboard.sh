#!/bin/bash

echo "🔧 Code Server Clipboard Fix Script"
echo "==================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if code-server instances are running
echo "1. Checking running code-server instances..."
RUNNING_INSTANCES=$(lsof -i :5253-5260 -P -n | grep LISTEN | wc -l)
if [ $RUNNING_INSTANCES -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Found $RUNNING_INSTANCES running instance(s)"
else
    echo -e "${YELLOW}⚠${NC} No code-server instances are running"
fi

# Check HTTPS certificates
echo ""
echo "2. Checking HTTPS certificates..."
CERT_DIR="$HOME/servers/code-server-data/shared/certs"
if [ -f "$CERT_DIR/code-server.pem" ] && [ -f "$CERT_DIR/code-server.key" ]; then
    echo -e "${GREEN}✓${NC} HTTPS certificates found"
    
    # Check if certificates are valid
    if openssl x509 -in "$CERT_DIR/code-server.pem" -text -noout > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Certificates are valid"
        
        # Show certificate info
        CERT_INFO=$(openssl x509 -in "$CERT_DIR/code-server.pem" -text -noout | grep "Subject:" | sed 's/.*CN=//')
        echo "   Certificate CN: $CERT_INFO"
    else
        echo -e "${RED}✗${NC} Certificates are invalid or corrupted"
        echo "   Run ./fix-https.sh to regenerate certificates"
    fi
else
    echo -e "${RED}✗${NC} HTTPS certificates not found"
    echo "   Run ./fix-https.sh to generate certificates"
fi

# Check if mkcert is installed
echo ""
echo "3. Checking mkcert installation..."
if command -v mkcert &> /dev/null; then
    echo -e "${GREEN}✓${NC} mkcert is installed"
else
    echo -e "${RED}✗${NC} mkcert is not installed"
    echo "   Install with: brew install mkcert"
fi

# Apply default settings to existing instances
echo ""
echo "4. Applying clipboard-friendly settings to instances..."
CONFIG_DIR="$HOME/servers/code-server-hub/config"
if [ -f "$CONFIG_DIR/default-settings.json" ]; then
    echo -e "${GREEN}✓${NC} Default settings file found"
    
    # Find all instance data directories
    INSTANCES_DIR="$HOME/code-server-data/instances"
    if [ -d "$INSTANCES_DIR" ]; then
        for instance in "$INSTANCES_DIR"/instance-*/data/User; do
            if [ -d "$instance" ]; then
                SETTINGS_FILE="$instance/settings.json"
                echo "   Updating settings for $(basename $(dirname $(dirname $instance)))"
                
                # Copy default settings if no settings exist
                if [ ! -f "$SETTINGS_FILE" ]; then
                    cp "$CONFIG_DIR/default-settings.json" "$SETTINGS_FILE"
                    echo -e "   ${GREEN}✓${NC} Applied default settings"
                else
                    echo -e "   ${YELLOW}⚠${NC} Settings already exist (manual merge required)"
                fi
            fi
        done
    else
        echo -e "${YELLOW}⚠${NC} No instance directories found"
    fi
else
    echo -e "${RED}✗${NC} Default settings file not found"
fi

# Browser recommendations
echo ""
echo "5. Browser Recommendations:"
echo "   ${YELLOW}Safari Users:${NC}"
echo "   - Enable clipboard permissions in Safari Settings → Websites → Clipboard"
echo "   - Use Shift + Right-click for native context menu"
echo "   - Consider using Chrome for better compatibility"
echo ""
echo "   ${GREEN}Chrome/Edge Users:${NC}"
echo "   - Should work with proper HTTPS certificates"
echo "   - Clear browser cache if issues persist"

# Summary
echo ""
echo "================================"
echo "Summary of Actions:"
echo ""

if [ -f "$CERT_DIR/code-server.pem" ] && openssl x509 -in "$CERT_DIR/code-server.pem" -text -noout > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} HTTPS is properly configured"
else
    echo -e "${RED}Action Required:${NC} Run ./fix-https.sh to fix HTTPS certificates"
fi

if [ $RUNNING_INSTANCES -eq 0 ]; then
    echo -e "${YELLOW}Action Required:${NC} Start code-server instances from the hub"
else
    echo -e "${YELLOW}Action Required:${NC} Restart code-server instances to apply changes"
fi

echo ""
echo "After fixing certificates and restarting instances:"
echo "1. Clear your browser cache"
echo "2. Access code-server via HTTPS (https://lothal.local:5253)"
echo "3. Test copy/paste functionality"
echo ""
echo "If issues persist, see: docs/clipboard-issues-fix.md"