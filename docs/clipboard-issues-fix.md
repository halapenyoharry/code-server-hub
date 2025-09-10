# Code-Server Clipboard & Right-Click Issues - Solutions Guide

## Problem Summary
Users are experiencing clipboard and right-click functionality issues in code-server instances:
- Copy/paste (Cmd+C/Cmd+V) not working consistently
- Right-click context menu sometimes doesn't appear
- Can't isolate specific text for copying
- Issues particularly pronounced in Safari browser

## Root Causes

### 1. Browser Security Restrictions
- The browser Clipboard API only works in **secure contexts** (HTTPS)
- Safari has additional restrictions compared to Chrome/Firefox
- Self-signed certificates can cause trust issues

### 2. Safari-Specific Limitations
- Safari doesn't support the `clipboard-read` and `clipboard-write` permissions
- WebSocket issues with TLS 1.3 in Safari
- Known historical bugs with clipboard operations in Safari

### 3. Code-Server Configuration
- Default keybindings may be left blank to avoid security warnings
- Terminal vs editor have different clipboard handling

## Solutions

### Solution 1: Ensure HTTPS is Properly Configured

1. **Verify HTTPS certificates are installed:**
   ```bash
   ls -la ~/code-server-data/shared/certs/
   ```

2. **Run the HTTPS fix script if needed:**
   ```bash
   cd /path/to/your/code-server-hub
   ./fix-https.sh
   ```

3. **Restart all code-server instances** after fixing certificates

### Solution 2: Browser-Specific Workarounds

#### For Safari Users:
1. **Use alternative keyboard shortcuts:**
   - Try `Shift + Insert` for paste
   - Use `Shift + Right-click` to access native browser context menu
   
2. **Enable clipboard permissions:**
   - Safari → Settings → Websites → Clipboard
   - Allow access for your code-server domains

3. **Consider switching to Chrome/Firefox** for better clipboard support

#### For All Browsers:
1. **Clear browser cache** after certificate updates
2. **Check browser console** for clipboard permission errors
3. **Ensure you're accessing via HTTPS** (not HTTP)

### Solution 3: Code-Server Configuration Updates

1. **Create or update VS Code settings** for each instance:

   ```bash
   # Create settings directory if it doesn't exist
   mkdir -p ~/code-server-data/instances/instance-5253/data/User
   ```

2. **Add clipboard-friendly settings** to `settings.json`:

   ```json
   {
     "terminal.integrated.copyOnSelection": true,
     "terminal.integrated.rightClickBehavior": "copyPaste",
     "editor.copyWithSyntaxHighlighting": true,
     "editor.emptySelectionClipboard": true,
     "terminal.integrated.commandsToSkipShell": [
       "workbench.action.terminal.copySelection",
       "workbench.action.terminal.paste"
     ]
   }
   ```

### Solution 4: Update Code-Server Configuration

1. **Modify the code-server manager** to include additional clipboard-related settings:

   ```yaml
   # Add to config.yaml generation in codeserver-manager.js
   disable-getting-started-override: true
   enable-proposed-api: ["ms-vscode.vscode-js-profile-flame"]
   ```

### Solution 5: Terminal-Specific Fixes

For terminal clipboard issues:
- **Editor**: Use `Ctrl/Cmd + C/V`
- **Terminal**: Use `Ctrl/Cmd + Shift + C/V`
- **Alternative**: Select text and use middle-mouse button to paste

## Immediate Actions

1. **Check certificate status:**
   ```bash
   openssl x509 -in ~/code-server-data/shared/certs/code-server.pem -text -noout | grep "Subject:"
   ```

2. **Test clipboard in different contexts:**
   - Try copying from editor to terminal
   - Try copying from terminal to external app
   - Test right-click in different areas

3. **Monitor browser console** for errors:
   - Open Developer Tools (F12)
   - Check Console tab for clipboard-related errors

## Long-term Recommendations

1. **Use Chrome/Chromium-based browsers** for best compatibility
2. **Implement proper SSL certificates** (Let's Encrypt) for production use
3. **Keep code-server updated** to latest version
4. **Consider using VS Code desktop** with Remote SSH for critical work

## Testing Clipboard Functionality

After implementing fixes, test:
1. Copy text from editor (`Cmd+C`)
2. Paste into terminal (`Cmd+Shift+V`)
3. Right-click in editor (should show context menu)
4. Copy from terminal (select + `Cmd+Shift+C`)
5. Paste to external application

## Known Limitations

- Safari will continue to have limited clipboard support
- Self-signed certificates may require manual trust
- Some clipboard operations may require explicit user permission
- iPad/iOS may have additional restrictions

## Additional Resources

- [Code-Server GitHub Issues](https://github.com/coder/code-server/issues)
- [MDN Clipboard API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [Safari Technology Preview](https://developer.apple.com/safari/technology-preview/) for testing latest Safari features