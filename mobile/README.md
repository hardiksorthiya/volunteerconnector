# Volunteer Connect Mobile App

This is the React Native mobile application for Volunteer Connect, built with Expo.

## Setup Instructions

### Prerequisites
- Node.js (>=16)
- Expo CLI installed globally: `npm install -g expo-cli`
- Expo Go app installed on your mobile device (for testing)

### Installation

1. Install dependencies:
```bash
cd mobile
npm install
```

### Running the App

1. Start the Expo development server:
```bash
npm start
```

2. You can then:
   - Scan the QR code with Expo Go app (iOS/Android)
   - Press `a` to open on Android emulator
   - Press `i` to open on iOS simulator

### API Configuration

**IMPORTANT**: The mobile app needs to connect to your backend API. Update the API URL in `src/config/api.js` based on your environment:

- **iOS Simulator**: `http://localhost:3000/api` (default)
- **Android Emulator**: `http://10.0.2.2:3000/api` (auto-configured)
- **Physical Device**: `http://YOUR_COMPUTER_IP:3000/api`

To find your computer's IP address:
- **Windows**: Run `ipconfig` and look for IPv4 Address
- **Mac/Linux**: Run `ifconfig` or `ip addr`

### Backend CORS Configuration

Make sure your backend server allows requests from your mobile app. Update `backend/server.js` CORS configuration if needed:

```javascript
app.use(cors({
  origin: '*', // For development, allow all origins
  // Or specify: ['http://localhost:3001', 'exp://YOUR_EXPO_URL']
  credentials: true
}));
```

### Current Features

- ✅ Login Screen
- ✅ Register/Signup Screen
- ✅ Navigation between screens
- ✅ API integration with backend
- ✅ AsyncStorage for token management
- ✅ Form validation
- ✅ Password visibility toggle
- ✅ Remember me functionality

### Project Structure

```
mobile/
├── src/
│   ├── config/
│   │   └── api.js          # API configuration
│   └── screens/
│       ├── LoginScreen.js  # Login screen
│       └── RegisterScreen.js # Registration screen
├── App.js                  # Main app component with navigation
├── app.json               # Expo configuration
└── package.json           # Dependencies
```

### Next Steps

To add more screens:
1. Create new screen components in `src/screens/`
2. Add them to the Stack Navigator in `App.js`
3. Implement navigation between screens

Example:
```javascript
// In App.js
<Stack.Screen name="Dashboard" component={DashboardScreen} />

// Navigate to it
navigation.navigate('Dashboard');
```

### Testing

1. Make sure your backend server is running on port 3000
2. Start the Expo development server
3. Test login/register functionality
4. Check that tokens are stored correctly in AsyncStorage

### Troubleshooting

**Connection Issues:**
- Ensure backend server is running
- Check API URL configuration matches your environment
- Verify CORS settings on backend
- For physical devices, ensure phone and computer are on same network

**Build Issues:**
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

