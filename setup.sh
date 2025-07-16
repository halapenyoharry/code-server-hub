#!/bin/bash

echo "🚀 Setting up Code Server Hub..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cat > .env << EOF
PORT=7777
NODE_ENV=development
EOF
fi

# Create start script
cat > start.sh << 'EOF'
#!/bin/bash
echo "Starting Code Server Hub..."
npm start
EOF

chmod +x start.sh

# Create development start script
cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "Starting Code Server Hub in development mode..."
npm run dev
EOF

chmod +x start-dev.sh

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the hub:"
echo "  ./start.sh"
echo ""
echo "For development with auto-reload:"
echo "  ./start-dev.sh"
echo ""
echo "The hub will be available at:"
echo "  http://localhost:7777"
echo ""
echo "Features:"
echo "- Auto-discovers all running services"
echo "- Real-time monitoring"
echo "- Visual service management"
echo "- Works from any device on your network"
