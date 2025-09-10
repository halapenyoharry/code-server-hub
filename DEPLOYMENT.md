# Code Server Hub Deployment Guide 🚀

This guide covers different deployment scenarios for Code Server Hub, from simple HTTP setups to secure HTTPS installations.

## Table of Contents
- [Quick Start (HTTP)](#quick-start-http)
- [Secure Deployment (HTTPS with mkcert)](#secure-deployment-https-with-mkcert)
- [iPad and Mobile Access](#ipad-and-mobile-access)
- [Remote Access via Tailscale](#remote-access-via-tailscale)
- [Troubleshooting](#troubleshooting)

## Quick Start (HTTP)

**⚠️ Warning**: HTTP mode disables some VS Code features (extensions, settings sync). Use HTTPS for full functionality.

### 1. Clone and Setup
```bash
git clone https://github.com/yourusername/code-server-hub.git
cd code-server-hub

# Install dependencies
npm install

# Configure your paths
cp config/paths.json.example config/paths.json
nano config/paths.json  # Edit to match your directories

# Copy and edit instances
cp instances.json.example instances.json
nano instances.json  # Configure your workspaces
```

### 2. Disable HTTPS (if you don't need extensions)
Edit instances to use HTTP by modifying the code-server config generation in `lib/codeserver-manager.js`.

### 3. Start the Hub
```bash
npm start
# Or use the service scripts
./start.sh
```

## Secure Deployment (HTTPS with mkcert)

**Recommended**: This method provides full VS Code functionality with trusted certificates.

### Prerequisites
- macOS or Linux (Windows WSL2 supported)
- Homebrew (macOS) or apt/yum (Linux)

### 1. Install mkcert
```bash
# macOS
brew install mkcert

# Linux (Debian/Ubuntu)
sudo apt install libnss3-tools
wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert
sudo chmod +x /usr/local/bin/mkcert
```

### 2. Run the HTTPS Fix Script
```bash
cd code-server-hub
./fix-https.sh
```

This script will:
- Install mkcert's root certificate (requires password)
- Generate trusted certificates for your hostname
- Configure code-server to use these certificates

### 3. Start the Hub
```bash
npm start
```

Your hub will now run with fully trusted HTTPS certificates!

## iPad and Mobile Access

### Installing Certificates on iOS/iPadOS

If you're still seeing security warnings on iPad after running fix-https.sh:

1. **Export the mkcert root certificate**:
   ```bash
   # Find the root certificate
   mkcert -CAROOT
   # This shows the directory, e.g., /Users/harold/Library/Application Support/mkcert
   
   # Copy it somewhere accessible
   cp "$(mkcert -CAROOT)/rootCA.pem" ~/Desktop/mkcert-root.crt
   ```

2. **Transfer to iPad**:
   - Email the `mkcert-root.crt` file to yourself
   - Or use AirDrop from Mac to iPad
   - Or host it temporarily: `python3 -m http.server 8888` and download from iPad

3. **Install on iPad**:
   - Open the certificate file on iPad
   - Go to Settings → General → Device Management
   - Tap the certificate profile and Install
   - Go to Settings → General → About → Certificate Trust Settings
   - Enable trust for the mkcert certificate

4. **Add to Home Screen** (recommended):
   - Open Safari and navigate to your hub
   - Tap Share → Add to Home Screen
   - The app will run fullscreen without browser chrome

## Remote Access via Tailscale

### 1. Install Tailscale
- Install on your server machine
- Install on your remote devices (iPad, laptop, etc.)

### 2. Configure the Hub
The hub already uses hostname instead of localhost, so it works with Tailscale out of the box:
- Access via: `https://your-machine-name:7777`
- Your Tailscale hostname will work automatically

### 3. Certificate Considerations
- You'll need to install the mkcert root certificate on each device
- Or generate certificates for your Tailscale hostname:
  ```bash
  mkcert -cert-file code-server.pem -key-file code-server.key your-machine-name.tail-scale.ts.net
  ```

## Service Management

### macOS (LaunchAgent)
```bash
# Install as a service
./install-service.sh

# Check status
./service-status.sh

# Stop service
./stop-service.sh

# Uninstall
./uninstall-service.sh
```

### Linux (systemd)
```bash
# Create service file
sudo nano /etc/systemd/system/code-server-hub.service
```

```ini
[Unit]
Description=Code Server Hub
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/code-server-hub
ExecStart=/usr/bin/node server.js
Restart=always
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable code-server-hub
sudo systemctl start code-server-hub
```

## Troubleshooting

### "Not Secure" Warnings
- Run `./fix-https.sh` to set up proper certificates
- Install mkcert root certificate on all devices
- Clear browser cache and restart

### Extensions Not Loading
- This is almost always an HTTPS/certificate issue
- Ensure you're using mkcert certificates, not self-signed
- Check browser console for specific errors

### Can't Access Remotely
- Check firewall rules for port 7777
- Ensure the hub binds to `0.0.0.0` not `127.0.0.1`
- Verify Tailscale is connected on both devices

### Scrolling Issues on Mobile
- The latest version includes scrolling fixes
- Try "Add to Home Screen" for better mobile experience
- Pull latest changes from GitHub

### Certificate Trust on New Devices
Each device needs to trust the mkcert root certificate:
1. Transfer the root certificate to the device
2. Install it in the system trust store
3. Enable trust in settings (iOS) or system preferences (macOS)

## Security Considerations

- **Never expose the hub directly to the internet** without authentication
- Use Tailscale or VPN for remote access
- The hub has no built-in authentication (relies on network security)
- Keep your mkcert root certificate private

## Next Steps

- Configure your instances in `instances.json`
- Install VS Code extensions via the hub
- Set up your preferred workspaces
- Enjoy seamless development across devices!

---

For more help, check the [main README](README.md) or open an issue on GitHub.