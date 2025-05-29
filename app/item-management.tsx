// your-expo-project/app/item-management.tsx
import React, { useEffect, useState, useCallback } from 'react'; // Added useCallback
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native'; // Added Pressable
import { useRouter, useFocusEffect } from 'expo-router'; // Added useFocusEffect
import { Item, ItemCategory } from '../models/item.model';
import { getItems /* addItem was here, but we add from AddItemScreen now */ } from '../data/database';
import { COLORS, SIZES } from '../constants/theme';

export default function ItemManagementScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => { // Wrapped in useCallback
    try {
      setIsLoading(true);
      setError(null);
      const fetchedItems = await getItems();
      setItems(fetchedItems);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      console.error("Failed to fetch items:", errorMessage);
      setError("Failed to load items. " + errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array means this function is stable

  // useFocusEffect will refetch items when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems]) // fetchItems is now a dependency
  );

  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{item.name} <Text style={styles.itemCategory}>({item.category})</Text></Text>
        <Text style={styles.itemDetails}>Price: Rs. {item.price.toFixed(2)}</Text>
        <Text style={styles.itemDetails}>
          Stock: {item.quantityInStock}
          {item.quantityInStock <= (item.lowStockThreshold || 5) && ( // Check low stock
            <Text style={styles.lowStockWarning}> (Low Stock!)</Text>
          )}
        </Text>
      </View>
      {/* We'll add Edit and Delete buttons here later */}
    </View>
  );


  if (isLoading && items.length === 0) { // Show loading only if no items are displayed yet
    return (
      <View style={styles.centerMessage}>
        <ActivityIndicator size="large" color={COLORS.primaryOrange} />
        <Text style={{ color: COLORS.primaryOrange, marginTop: 10 }}>Loading items...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.buttonSmall} onPress={fetchItems}>
            <Text style={styles.buttonSmallText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={() => router.push('/add-item')}>
        <Text style={styles.buttonText}>+ Add New Item</Text>
      </Pressable>

      {items.length === 0 && !isLoading ? ( // Check !isLoading here
        <Text style={styles.placeholderText}>No items found. Add some!</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: SIZES.padding }}
          refreshing={isLoading} // Show refresh indicator while fetching
          onRefresh={fetchItems} // Allow pull-to-refresh
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: SIZES.padding, // Padding applied to inner elements or FlatList content
    backgroundColor: COLORS.lightGray,
  },
  centerMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    padding: SIZES.padding,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.body3,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: SIZES.body3,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: SIZES.padding * 2,
  },
  itemContainer: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding / 1.2,
    marginVertical: SIZES.base / 1.5,
    marginHorizontal: SIZES.padding / 2, // Added horizontal margin
    borderRadius: SIZES.radius,
    borderColor: COLORS.mediumGray,
    borderWidth: 0.5,
    flexDirection: 'row', // For edit/delete buttons later
    justifyContent: 'space-between', // For edit/delete buttons later
    alignItems: 'center', // For edit/delete buttons later
  },
  itemTextContainer: {
    flex: 1, // Allow text to take available space
  },
  itemName: {
    fontSize: SIZES.h3,
    color: COLORS.primaryBlack,
    fontWeight: 'bold',
  },
  itemCategory: {
    fontSize: SIZES.body5,
    color: COLORS.secondaryBlack,
    fontStyle: 'italic',
  },
  itemDetails: {
    fontSize: SIZES.body4,
    color: COLORS.secondaryBlack,
    marginTop: SIZES.base / 2,
  },
  lowStockWarning: {
    color: COLORS.error, // Or primaryOrange for warning
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: COLORS.primaryOrange,
    padding: SIZES.padding / 1.2,
    borderRadius: SIZES.radius,
    margin: SIZES.padding /2, // Margin around the button
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white, // Changed to white for better contrast on orange
    fontSize: SIZES.h3,
    fontWeight: 'bold',
  },
  buttonSmall: { // For retry button
    backgroundColor: COLORS.primaryOrange,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  buttonSmallText: {
    color: COLORS.white,
    fontSize: SIZES.body3,
    fontWeight: 'bold',
  }
});