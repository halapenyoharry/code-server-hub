#!/bin/bash

echo "🔐 Code Server Hub HTTPS Fix Script"
echo "==================================="
echo ""
echo "This script will set up proper HTTPS certificates using mkcert"
echo "to fix SSL issues with VS Code extensions like Twinny."
echo ""

# Step 1: Install mkcert CA (requires sudo)
echo "Step 1: Installing mkcert Certificate Authority..."
echo "You'll be prompted for your password:"
mkcert -install

# Step 2: Generate new certificates
echo ""
echo "Step 2: Generating new certificates for lothal.local..."
cd ~/servers/code-server-data/shared/certs

# Backup old certificates
if [ -f code-server.pem ]; then
    echo "Backing up existing certificates..."
    mv code-server.pem code-server.pem.backup
    mv code-server.key code-server.key.backup
fi

# Generate new certificates
mkcert -cert-file code-server.pem -key-file code-server.key lothal.local localhost 127.0.0.1 ::1

echo ""
echo "Step 3: Setting proper permissions..."
chmod 644 code-server.pem
chmod 600 code-server.key

echo ""
echo "✅ HTTPS certificates have been fixed!"
echo ""
echo "Next steps:"
echo "1. Restart all code-server instances from the hub"
echo "2. Refresh your browser (you may need to clear cache)"
echo "3. Extensions like Twinny should now work properly"
echo ""
echo "The new certificates are trusted by your system and will work"
echo "across all browsers and VS Code extensions."