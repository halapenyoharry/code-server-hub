#!/bin/bash

echo "🌐 Universal Browser Clipboard Fix for Code Server"
echo "================================================="
echo ""

# Function to update code-server config for better clipboard support
update_codeserver_config() {
    local instance_dir="$1"
    local config_file="$instance_dir/config.yaml"
    
    if [ -f "$config_file" ]; then
        echo "Updating config for instance: $(basename $instance_dir)"
        
        # Add browser-specific workarounds to config
        if ! grep -q "disable-getting-started-override" "$config_file"; then
            echo "disable-getting-started-override: true" >> "$config_file"
        fi
        
        # Ensure workspace trust is disabled (can interfere with clipboard)
        if ! grep -q "disable-workspace-trust" "$config_file"; then
            echo "disable-workspace-trust: true" >> "$config_file"
        fi
    fi
}

# Apply VS Code settings that help with clipboard
apply_universal_settings() {
    local settings_file="$1"
    
    # Create parent directory if it doesn't exist
    mkdir -p "$(dirname "$settings_file")"
    
    # Universal clipboard-friendly settings
    cat > "$settings_file" << 'EOF'
{
  // Universal clipboard fixes
  "editor.copyWithSyntaxHighlighting": false,
  "terminal.integrated.copyOnSelection": true,
  "terminal.integrated.rightClickBehavior": "copyPaste",
  
  // Zen Browser (Firefox-based) specific
  "editor.selectionClipboard": false,
  
  // Help with right-click issues
  "editor.contextmenu": true,
  "workbench.editor.enablePreview": false,
  
  // Alternative copy methods
  "editor.multiCursorModifier": "ctrlCmd",
  "editor.selectionHighlight": true,
  
  // Terminal fixes for all browsers
  "terminal.integrated.macOptionIsMeta": true,
  "terminal.integrated.macOptionClickForcesSelection": true,
  
  // Disable features that interfere with clipboard
  "telemetry.enableTelemetry": false,
  "workbench.settings.enableNaturalLanguageSearch": false
}
EOF
}

echo "1. Detecting your browsers..."
echo ""

# Check which browsers are installed
browsers_found=""
if [ -d "/Applications/Zen Browser.app" ]; then
    browsers_found="$browsers_found Zen"
    echo "✓ Zen Browser detected"
fi

if [ -d "/Applications/Brave Browser.app" ]; then
    browsers_found="$browsers_found Brave"
    echo "✓ Brave Browser detected"
fi

if [ -d "/Applications/Safari.app" ]; then
    browsers_found="$browsers_found Safari"
    echo "✓ Safari detected"
fi

echo ""
echo "2. Applying universal fixes..."

# Find all code-server instances
INSTANCES_DIR="$HOME/servers/code-server-data/instances"
if [ -d "$INSTANCES_DIR" ]; then
    for instance in "$INSTANCES_DIR"/instance-*; do
        if [ -d "$instance" ]; then
            # Update config
            update_codeserver_config "$instance"
            
            # Apply settings
            settings_path="$instance/data/User/settings.json"
            apply_universal_settings "$settings_path"
        fi
    done
    echo "✓ Updated all instance configurations"
else
    echo "⚠️  No instances found. Settings will be applied when instances are created."
fi

echo ""
echo "3. Browser-specific instructions:"
echo ""

if [[ $browsers_found == *"Zen"* ]]; then
    echo "🦊 Zen Browser (Firefox-based):"
    echo "   1. Open about:config"
    echo "   2. Search for 'asyncClipboard'"
    echo "   3. Set these to true:"
    echo "      - dom.events.asyncClipboard.clipboardItem"
    echo "      - dom.events.asyncClipboard.read"
    echo "      - dom.events.asyncClipboard.write"
    echo "   4. Use Shift+Right-click for browser's native menu"
    echo ""
fi

if [[ $browsers_found == *"Brave"* ]]; then
    echo "🦁 Brave Browser:"
    echo "   1. Click the Brave Shield icon in the address bar"
    echo "   2. Turn off shields for your code-server sites"
    echo "   3. Or go to brave://settings/content/clipboard"
    echo "   4. Add your code-server URLs to allowed sites"
    echo ""
fi

if [[ $browsers_found == *"Safari"* ]]; then
    echo "🧭 Safari (including iPad):"
    echo "   1. Go to Settings → Websites → Clipboard"
    echo "   2. Allow clipboard access for your sites"
    echo "   3. Always use Shift+Right-click for context menu"
    echo "   4. Cmd+A then Cmd+C works better than selection"
    echo ""
fi

echo "4. Universal keyboard shortcuts that work in ALL browsers:"
echo "   📝 Editor:"
echo "      • Copy: Cmd+C (after selecting with Cmd+A if needed)"
echo "      • Paste: Cmd+V"
echo "      • Cut: Cmd+X"
echo ""
echo "   🖥️  Terminal:"
echo "      • Copy: Cmd+Shift+C"
echo "      • Paste: Cmd+Shift+V"
echo "      • Alternative paste: Shift+Insert"
echo "      • Middle mouse button paste"
echo ""

echo "5. Testing clipboard:"
echo "   1. Restart your code-server instances from the hub"
echo "   2. Clear browser cache (Cmd+Shift+Delete)"
echo "   3. Try the keyboard shortcuts above"
echo "   4. If right-click still fails, use Shift+Right-click"
echo ""

echo "✅ Universal fixes applied!"
echo ""
echo "Note: Some browsers have fundamental clipboard limitations in web apps."
echo "The keyboard shortcuts above will ALWAYS work regardless of browser."
echo ""

# Create a quick reference file
cat > "$HOME/servers/code-server-hub/CLIPBOARD-SHORTCUTS.txt" << 'EOF'
CODE SERVER CLIPBOARD QUICK REFERENCE
====================================

UNIVERSAL SHORTCUTS (Work in ALL Browsers)
------------------------------------------
EDITOR:
  Copy:  Cmd+C (select with Cmd+A first if needed)
  Paste: Cmd+V
  Cut:   Cmd+X

TERMINAL:
  Copy:  Cmd+Shift+C
  Paste: Cmd+Shift+V or Shift+Insert
  
RIGHT-CLICK FIX:
  Use Shift+Right-click for browser's native menu

BROWSER-SPECIFIC FIXES
----------------------
ZEN/FIREFOX: Set asyncClipboard flags in about:config
BRAVE: Disable shields or allow clipboard in settings
SAFARI: Enable clipboard in Settings → Websites → Clipboard

ALWAYS WORKS:
- Keyboard shortcuts above
- Middle mouse paste in terminal
- Cmd+A to select all, then Cmd+C
EOF

echo "📋 Created CLIPBOARD-SHORTCUTS.txt for quick reference"