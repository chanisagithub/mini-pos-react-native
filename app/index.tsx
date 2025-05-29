// your-expo-project/app/index.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { COLORS, SIZES } from '../constants/theme'; // Adjust path

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mini POS</Text>

      {/* Option 1: Using Link component for navigation */}
      <Link href="/item-management" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Manage Items</Text>
        </Pressable>
      </Link>

      <Link href="/new-order" asChild disabled>
        <Pressable style={[styles.button, styles.disabledButton]} disabled>
          <Text style={styles.buttonText}>New Order (Coming Soon)</Text>
        </Pressable>
      </Link>

      {/* Option 2: Imperative navigation with useRouter hook
      <Pressable style={styles.button} onPress={() => router.push('/item-management')}>
        <Text style={styles.buttonText}>Manage Items (useRouter)</Text>
      </Pressable>
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlack,
    padding: SIZES.padding,
  },
  title: {
    fontSize: SIZES.h1,
    color: COLORS.primaryOrange,
    marginBottom: SIZES.padding * 2,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primaryOrange,
    paddingVertical: SIZES.padding / 1.5,
    paddingHorizontal: SIZES.padding * 2,
    borderRadius: SIZES.radius,
    marginVertical: SIZES.base * 1.5,
    width: '80%',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.mediumGray,
  },
  buttonText: {
    color: COLORS.primaryBlack,
    fontSize: SIZES.h3,
    fontWeight: 'bold',
  },
});