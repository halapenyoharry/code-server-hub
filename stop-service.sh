#!/bin/bash

# Stop Code Server Hub service

echo "Stopping Code Server Hub service..."

# Stop the service
launchctl stop com.harold.codeserverhub

echo "✓ Service stopped"
echo "Note: Service will restart automatically at next login"
echo "To prevent auto-start, run: ./uninstall-service.sh"