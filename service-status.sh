#!/bin/bash

# Check status of Code Server Hub service

echo "Code Server Hub Service Status:"
echo "==============================="

# Check if plist is installed
if [ -f ~/Library/LaunchAgents/com.harold.codeserverhub.plist ]; then
    echo "✓ Service is installed"
else
    echo "✗ Service is NOT installed"
    echo "  Run: ./install-service.sh to install"
    exit 1
fi

# Check launchctl status
STATUS=$(launchctl list | grep com.harold.codeserverhub)
if [ -n "$STATUS" ]; then
    echo "✓ Service is loaded in launchctl"
    echo "  Status: $STATUS"
    
    # Extract PID
    PID=$(echo "$STATUS" | awk '{print $1}')
    if [ "$PID" != "-" ]; then
        echo "✓ Service is running (PID: $PID)"
        
        # Check if server is responding
        if curl -s http://localhost:7777 > /dev/null; then
            echo "✓ Server is responding at http://localhost:7777"
        else
            echo "✗ Server is not responding (may be starting up)"
        fi
    else
        echo "✗ Service is not running"
        echo "  Run: launchctl start com.harold.codeserverhub"
    fi
else
    echo "✗ Service is not loaded"
    echo "  Run: launchctl load ~/Library/LaunchAgents/com.harold.codeserverhub.plist"
fi

# Check logs
echo ""
echo "Recent logs:"
if [ -f ~/Library/Logs/codeserverhub.log ]; then
    echo "--- stdout ---"
    tail -n 5 ~/Library/Logs/codeserverhub.log
fi

if [ -f ~/Library/Logs/codeserverhub.error.log ]; then
    echo "--- stderr ---"
    tail -n 5 ~/Library/Logs/codeserverhub.error.log
fi