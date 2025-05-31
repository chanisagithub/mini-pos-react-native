// your-expo-project/app/item-management.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect, Link } from 'expo-router';
import { Item, ItemCategory } from '../models/item.model';
import { getItems, deleteItem } from '../data/database';
import { COLORS, SIZES } from '../constants/theme';

export default function ItemManagementScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  const handleDeleteItem = (item: Item) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const rowsAffected = await deleteItem(item.id!);
              if (rowsAffected > 0) {
                Alert.alert("Success", `"${item.name}" deleted successfully.`);
                fetchItems(); // Refresh the list
              } else {
                Alert.alert("Error", `Could not delete "${item.name}". It might have already been deleted or is part of an order.`);
              }
            } catch (e: any) {
              console.error("Failed to delete item:", e);
              Alert.alert("Error", `Failed to delete item: ${e.message || 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>({item.name}) <Text style={styles.itemCategory}>({item.category})</Text></Text>
        <Text style={styles.itemDetails}>Price: Rs. {item.price.toFixed(2)}</Text>
        <Text style={styles.itemDetails}>
          Stock: {item.quantityInStock}
          {item.quantityInStock <= (item.lowStockThreshold || 5) && (
            <Text style={styles.lowStockWarning}> Low Stock!</Text>
          )}
        </Text>
      </View>
      <View style={styles.itemActionsContainer}>
        <Link href={{ pathname: "/add-item", params: { itemId: item.id } }} asChild>
          <Pressable style={[styles.actionButton, styles.editButton]}>
            <Text style={styles.actionButtonText}>Edit</Text>
          </Pressable>
        </Link>
        <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDeleteItem(item)}>
          <Text style={styles.actionButtonText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );


  if (isLoading && items.length === 0) {
    return (
      <View style={styles.centerMessage}>
        <ActivityIndicator size="large" color={COLORS.primaryOrange} />
        <Text style={{ color: COLORS.primaryOrange, marginTop: 10 }}>Loading items...</Text>
      </View>
    );
  }

  if (error && items.length === 0) {
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
      {error && <Text style={styles.inlineErrorText}>{error}</Text>}


      {items.length === 0 && !isLoading ? (
        <Text style={styles.placeholderText}>No items found. Add some!</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: SIZES.padding }}
          refreshing={isLoading}
          onRefresh={fetchItems}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  centerMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    padding: SIZES.padding,
  },
  errorText: { // For prominent errors
    color: COLORS.error,
    fontSize: SIZES.h3,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  inlineErrorText: { // For less critical errors shown above list
    color: COLORS.error,
    fontSize: SIZES.body4,
    textAlign: 'center',
    paddingVertical: SIZES.base,
    backgroundColor: '#FFD2D2' // Light red background for inline errors
  },
  placeholderText: {
    fontSize: SIZES.body3,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: SIZES.padding * 2,
  },
  itemContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.padding / 1.5,
    paddingHorizontal: SIZES.padding / 1.2,
    marginVertical: SIZES.base / 1.5,
    marginHorizontal: SIZES.padding / 2,
    borderRadius: SIZES.radius,
    borderColor: COLORS.mediumGray,
    borderWidth: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTextContainer: {
    flex: 1,
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
    color: COLORS.error,
    fontWeight: 'bold',
  },
  itemActionsContainer: {
    flexDirection: 'column', // Stack edit/delete vertically
    alignItems: 'flex-end', // Align to the right
  },
  actionButton: {
    paddingVertical: SIZES.base / 1.2,
    paddingHorizontal: SIZES.base * 1.5,
    borderRadius: SIZES.radius / 1.5,
    minWidth: 60, // Ensure buttons have some width
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: COLORS.secondaryOrange,
    marginBottom: SIZES.base / 1.5, // Space between edit and delete
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body5,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: COLORS.primaryOrange,
    padding: SIZES.padding / 1.2,
    borderRadius: SIZES.radius,
    marginVertical: SIZES.padding / 1.5,
    marginHorizontal: SIZES.padding /2,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.h3,
    fontWeight: 'bold',
  },
  buttonSmall: {
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