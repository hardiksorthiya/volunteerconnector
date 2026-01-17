# Troubleshooting Icon Issues

## If Icons Don't Show or App Crashes

### Quick Fixes:

1. **Clear Cache and Restart:**
   ```bash
   cd mobile
   npx expo start --clear
   ```

2. **If Port is Busy:**
   - Stop any running Expo servers
   - Or use a different port: `npx expo start --port 8082`

3. **Check Console for Errors:**
   - Look for any import errors
   - Check if Icons.js is properly exported

### Common Issues:

**Issue: Icons not rendering**
- Solution: Icons use simple View components that should work
- If still not working, we can switch to text-based icons

**Issue: Import errors**
- Make sure `mobile/src/components/Icons.js` exists
- Check that exports match imports in App.js and Header.js

**Issue: Transform not working**
- Removed all transform/rotate properties
- Using simple positioning only

### Alternative: Text-Based Icons

If View-based icons still don't work, we can use simple Unicode characters:
- Home: ⬟ or ⌂
- Activity: ☰ or ≡
- Chat: 💬 or ☎
- Settings: ⚙ or ☰
- Notification: 🔔 or ⚠

Let me know what specific error you're seeing!

