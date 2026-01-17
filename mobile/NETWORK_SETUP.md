# Network Setup Guide for Mobile App

## Network Error Fix

If you're getting `ERR_NETWORK` or `Network Error`, follow these steps:

### 1. Update API Configuration

The API URL in `mobile/src/config/api.js` is now configured for physical devices:
- **Your Computer IP**: `192.168.1.9`
- **API URL**: `http://192.168.1.9:3000/api`

### 2. Ensure Backend Server is Running

Make sure your backend server is running:
```bash
cd backend
npm start
```

The server should be listening on port 3000.

### 3. Check Firewall Settings

**Windows Firewall:**
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Firewall"
3. Make sure Node.js is allowed for both Private and Public networks
4. Or temporarily disable firewall for testing

**Quick Fix:**
```powershell
# Allow Node.js through firewall (run as Administrator)
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=3000
```

### 4. Ensure Same Network

- Your computer and mobile device must be on the **same WiFi network**
- Check your phone's WiFi connection
- Verify both devices can see each other on the network

### 5. Test Connection

You can test if the backend is accessible from your phone:
1. Open a browser on your phone
2. Go to: `http://192.168.1.9:3000/api/health`
3. You should see a response (if health endpoint exists)

### 6. Switch Between Emulator and Physical Device

In `mobile/src/config/api.js`:
- Set `USE_PHYSICAL_DEVICE = true` for physical device
- Set `USE_PHYSICAL_DEVICE = false` for emulator/simulator

### 7. Restart Everything

After making changes:
1. Stop the Expo server (Ctrl+C)
2. Restart backend server
3. Restart Expo: `npx expo start --clear`
4. Reload the app

## Troubleshooting

**Still getting network error?**
1. Check if backend is running: `http://localhost:3000/api/health`
2. Check your computer's IP hasn't changed: `ipconfig`
3. Update the IP in `mobile/src/config/api.js` if it changed
4. Make sure port 3000 is not blocked by firewall
5. Try accessing the API from phone's browser first

