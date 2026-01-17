import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NotificationIcon } from './Icons';

const Header = ({ onNotificationPress }) => {
  return (
    <View style={styles.header}>
      <StatusBar style="dark" />
      <View style={styles.headerContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Volunteer</Text>
          <Text style={styles.logoSubtext}>Connect</Text>
        </View>

        {/* Notification Icon */}
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={onNotificationPress}
        >
          <NotificationIcon size={24} color="#1f2937" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
  },
  logoSubtext: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default Header;

