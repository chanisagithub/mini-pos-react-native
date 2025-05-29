import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { initDatabase } from './data/database';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import AppNavigator from './navigation/AppNavigator'; // Adjust path
import { COLORS, SIZES } from './constants/theme'; // Adjust path

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => {
        setDbInitialized(true);
        console.log('Database ready!');
      })
      .catch(err => {
        console.error('Database initialization failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(`Failed to initialize the database: ${errorMessage}. Please restart the app.`);
      });
  }, []);

  if (error) {
    return (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!dbInitialized) {
    return (
      <View style={styles.centerMessage}>
        <ActivityIndicator size="large" color={COLORS.primaryOrange} />
        <Text style={styles.loadingText}>Initializing Database...</Text>
      </View>
    );
  }

  // Once DB is initialized, render your main app navigation
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
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
  },
});