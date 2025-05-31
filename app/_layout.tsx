import React, { useEffect, useState } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { initDatabase } from '../data/database'; // Adjust path if your database.ts is elsewhere
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme'; // Adjust path

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Initializing database...');
        await initDatabase();
        setDbInitialized(true);
        console.log('Database initialized successfully.');
        SplashScreen.hideAsync(); // Hide the splash screen now that we are ready
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        console.error('Database initialization failed:', errorMessage, e);
        setDbError(`Failed to initialize DB: ${errorMessage}`);
        SplashScreen.hideAsync(); // Still hide splash screen on error to show the error message
      }
    };
    initialize();
  }, []);

  if (dbError) {
    return (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>Error</Text>
        <Text style={styles.errorText}>{dbError}</Text>
      </View>
    );
  }

  if (!dbInitialized) {
    // You can return a custom loading component here if you prefer
    // SplashScreen.preventAutoHideAsync() will keep the native splash screen visible.
    // If you want a JS-based loading screen while DB init, show it here.
    // For simplicity, we rely on the native splash screen + a brief indicator if needed.
    return (
        <View style={styles.centerMessage}>
            <ActivityIndicator size="large" color={COLORS.primaryOrange} />
            <Text style={styles.loadingText}>Initializing App...</Text>
        </View>
    );
  }

  // This is the main navigator for your app using expo-router
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primaryBlack,
        },
        headerTintColor: COLORS.primaryOrange,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mini POS Home' }} />
      <Stack.Screen name="item-management" options={{ title: 'Manage Your Items' }} />
      <Stack.Screen name="add-item" options={{ title: 'Item Details' }} />
      <Stack.Screen name="new-order" options={{ title: 'Create New Order' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  centerMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.primaryBlack,
  },
  loadingText: {
    marginTop: SIZES.base,
    fontSize: SIZES.body3,
    color: COLORS.primaryOrange,
  },
  errorText: {
    fontSize: SIZES.body3,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SIZES.base,
  },
});