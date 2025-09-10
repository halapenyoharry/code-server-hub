#!/bin/bash

echo "Setting up default VS Code extensions for Code Server Hub..."
echo ""

# Ensure code-server is installed
if ! command -v /opt/homebrew/bin/code-server &> /dev/null; then
    echo "Error: code-server not found at /opt/homebrew/bin/code-server"
    echo "Please install code-server first: brew install code-server"
    exit 1
fi

# Create shared extensions directory
EXTENSIONS_DIR="$HOME/code-server-data/shared/extensions"
mkdir -p "$EXTENSIONS_DIR"

echo "Installing default extensions to shared directory..."
echo "Location: $EXTENSIONS_DIR"
echo ""

# List of essential extensions
EXTENSIONS=(
    "esbenp.prettier-vscode"
    "dbaeumer.vscode-eslint"
    "eamodio.gitlens"
    "vscodevim.vim"
    "ms-python.python"
    "golang.go"
    "bradlc.vscode-tailwindcss"
    "ritwickdey.liveserver"
    "github.copilot"
    "saoudrizwan.claude-dev"
)

# Install each extension
for ext in "${EXTENSIONS[@]}"; do
    echo "Installing $ext..."
    /opt/homebrew/bin/code-server --extensions-dir "$EXTENSIONS_DIR" --install-extension "$ext" || true
done

echo ""
echo "✅ Default extensions setup complete!"
echo ""
echo "Extensions are shared between all instances to save space."
echo "Each instance still maintains its own settings and state."
echo ""
echo "To add more extensions, either:"
echo "1. Edit default-extensions.json and run this script again"
echo "2. Install directly in any code-server instance (will be available to all)"