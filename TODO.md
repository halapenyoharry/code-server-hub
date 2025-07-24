# TODO / Known Issues

## High Priority

### SSL Certificate Trust Issue
**Problem**: When accessing code-server instances via HTTPS, users must:
1. Accept browser security warnings for self-signed certificates
2. Manually add certificates to system keychain for VS Code extensions (Service Workers)

**Impact**: VS Code extensions like Cline that use webviews fail with SSL certificate errors until the certificate is manually trusted in the system keychain.

**Solution**: Implement automatic certificate trust during setup:
- Generate proper certificates with mkcert (if available)
- Provide automated script to add certificates to system trust store
- Document manual trust process for different platforms
- Consider using Let's Encrypt for production deployments

**Workaround**: Users must manually run:
```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain /Users/harold/servers/code-server-data/shared/certs/code-server.pem
```

## Medium Priority

- Add health checks for code-server instances
- Implement automatic extension updates
- Add support for custom SSL certificates
- Create setup wizard for first-time users

## Low Priority

- Add themes/color customization for the hub UI
- Implement service dependency visualization
- Add Docker container support