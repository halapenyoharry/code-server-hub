#!/bin/bash

# Install Code Server Hub as a LaunchAgent service

echo "Installing Code Server Hub auto-start service..."

# Create logs directory if it doesn't exist
mkdir -p ~/Library/Logs

# Copy the plist file to LaunchAgents
cp com.harold.codeserverhub.plist ~/Library/LaunchAgents/

# Load the service
launchctl load ~/Library/LaunchAgents/com.harold.codeserverhub.plist

# Start the service immediately
launchctl start com.harold.codeserverhub

echo "✓ Code Server Hub service installed and started"
echo "  - Service will start automatically at login"
echo "  - Logs: ~/Library/Logs/codeserverhub.log"
echo "  - Access at: http://localhost:7777"
echo ""
echo "To check status: launchctl list | grep codeserverhub"
echo "To stop service: ./stop-service.sh"
echo "To uninstall: ./uninstall-service.sh"