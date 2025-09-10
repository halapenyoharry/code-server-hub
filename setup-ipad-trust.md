# Setting up Certificate Trust on iPad

To access code-server instances from your iPad without security warnings, you need to install the mkcert root certificate.

## Option 1: Email the Certificate (Easiest)

1. **On your Mac**, run:
   ```bash
   cp ~/Library/Application\ Support/mkcert/rootCA.pem ~/Desktop/mkcert-ca.crt
   ```

2. **Email the file** `mkcert-ca.crt` to yourself

3. **On your iPad**:
   - Open the email
   - Tap the certificate attachment
   - Tap "Install" when prompted
   - Go to Settings > General > About > Certificate Trust Settings
   - Enable trust for "mkcert development CA"

## Option 2: AirDrop

1. **On your Mac**, run:
   ```bash
   cp ~/Library/Application\ Support/mkcert/rootCA.pem ~/Desktop/mkcert-ca.crt
   ```

2. **AirDrop** the file to your iPad

3. **On your iPad**, follow the same installation steps as above

## Option 3: Hosted Profile

1. **On your Mac**, run:
   ```bash
   # Copy certificate to hub's public directory
   cp ~/Library/Application\ Support/mkcert/rootCA.pem ~/servers/code-server-hub/public/mkcert-ca.crt
   ```

2. **On your iPad**, navigate to:
   ```
   http://192.168.3.2:7777/mkcert-ca.crt
   ```

3. Install and trust the certificate as above

## After Installation

Once the certificate is trusted on your iPad:
- Access code-server at https://192.168.3.2:7771 with no warnings
- Extensions will load properly
- Service workers will function correctly

## Security Note

This certificate allows your iPad to trust ANY certificate signed by your Mac's mkcert. Only install this on devices you own and trust.