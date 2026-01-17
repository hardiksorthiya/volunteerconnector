import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import ActivityDetailScreen from './src/screens/ActivityDetailScreen';
import AddActivityScreen from './src/screens/AddActivityScreen';
import EditActivityScreen from './src/screens/EditActivityScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import { HomeIcon, ActivityIcon, ChatIcon, SettingsIcon } from './src/components/Icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator (shown after login)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <HomeIcon size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          tabBarLabel: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <ActivityIcon size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: 'AI Chat',
          tabBarIcon: ({ color, size }) => (
            <ChatIcon size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigationRef = useRef(null);

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();
    
    // Set up interval to check auth status periodically
    const authCheckInterval = setInterval(() => {
      checkAuthStatus();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(authCheckInterval);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (token) {
        setIsAuthenticated((prevAuth) => {
          if (!prevAuth) {
            // User just logged in
            return true;
          }
          return true;
        });
      } else {
        setIsAuthenticated((prevAuth) => {
          // If user was authenticated but now token is gone, navigate to login
          if (prevAuth && navigationRef.current?.isReady()) {
            setTimeout(() => {
              navigationRef.current?.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }, 100);
          }
          return false;
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    // Return a simple loading view instead of null
    return (
      <View style={{ flex: 1, backgroundColor: '#1e3a8a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ffffff" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'MainTabs' : 'Login'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1e3a8a' },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen 
          name="ActivityDetail" 
          component={ActivityDetailScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="AddActivity" 
          component={AddActivityScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="EditActivity" 
          component={EditActivityScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfileScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="ChangePassword" 
          component={ChangePasswordScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
