# Troubleshooting Guide - "Cannot read property 'S' of undefined"

## Fixes Applied

### 1. **Added react-native-screens import in index.js**
   - `react-native-screens` must be imported BEFORE `react-native-gesture-handler`
   - Both must be imported before any other code

### 2. **Switched to NativeStackNavigator**
   - Changed from `@react-navigation/stack` to `@react-navigation/native-stack`
   - Better performance and compatibility with Expo SDK 54
   - Changed `cardStyle` to `contentStyle` (correct prop for NativeStackNavigator)

### 3. **Added @react-navigation/native-stack package**
   - Installed the required package for NativeStackNavigator

## Steps to Resolve

1. **Stop the current Expo server** (Ctrl+C)

2. **Clear all caches:**
   ```bash
   cd mobile
   rm -rf node_modules
   rm -rf .expo
   npm cache clean --force
   ```

3. **Reinstall dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

4. **Start Expo with cleared cache:**
   ```bash
   npx expo start --clear
   ```

5. **Reload the app:**
   - Press `r` in the terminal, or
   - Shake device and select "Reload"

## If Still Not Working

### Option 1: Try a minimal test
Create a simple test screen to verify navigation works:

```javascript
// In App.js, temporarily replace with:
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Test" 
          component={() => <View><Text>Test Screen</Text></View>} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Option 2: Check for version conflicts
```bash
npm ls react react-native @react-navigation/native @react-navigation/native-stack
```

### Option 3: Verify Expo SDK compatibility
Make sure all packages are compatible with Expo SDK 54:
- expo: ~54.0.0
- react: 19.1.0
- react-native: 0.81.5

## Current Configuration

- **Entry Point:** `index.js` (imports screens and gesture-handler first)
- **Navigator:** NativeStackNavigator (from @react-navigation/native-stack)
- **Screens:** LoginScreen, RegisterScreen
- **Status:** All dependencies installed and configured

