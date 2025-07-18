#!/bin/bash

# Uninstall Code Server Hub LaunchAgent service

echo "Uninstalling Code Server Hub auto-start service..."

# Stop the service if running
launchctl stop com.harold.codeserverhub

# Unload the service
launchctl unload ~/Library/LaunchAgents/com.harold.codeserverhub.plist 2>/dev/null

# Remove the plist file
rm -f ~/Library/LaunchAgents/com.harold.codeserverhub.plist

echo "✓ Code Server Hub service uninstalled"
echo "  - Service will no longer start at login"
echo "  - You can still run manually with: npm start"