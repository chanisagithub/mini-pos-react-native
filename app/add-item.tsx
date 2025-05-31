// your-expo-project/app/add-item.tsx
import React, { useState, useEffect, useLayoutEffect } from 'react'; // Added useEffect, useLayoutEffect
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, Pressable,ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router'; // Added useLocalSearchParams, Stack
import { ItemCategory, Item } from '../models/item.model';
import { addItem, getItemById, updateItem } from '../data/database'; // Added getItemById, updateItem
import { COLORS, SIZES } from '../constants/theme';
// import { Picker } from '@react-native-picker/picker';

interface AddEditItemScreenParams {
  itemId?: string;
}

export default function AddEditItemScreen() { // Renamed component for clarity
  const router = useRouter();
//   const params = useLocalSearchParams<{ itemId?: string }>();
const params = useLocalSearchParams<AddEditItemScreenParams>();
  const itemId = params.itemId ? parseInt(params.itemId, 10) : undefined;
  const isEditMode = itemId !== undefined;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>(ItemCategory.MAIN);
  const [price, setPrice] = useState('');
  const [quantityInStock, setQuantityInStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For loading item data in edit mode

  useEffect(() => {
    if (isEditMode && itemId) {
      setIsLoading(true);
      const loadItemData = async () => {
        try {
          const item = await getItemById(itemId);
          if (item) {
            setName(item.name);
            setCategory(item.category);
            setPrice(item.price.toString());
            setQuantityInStock(item.quantityInStock.toString());
            setLowStockThreshold((item.lowStockThreshold || 5).toString());
          } else {
            setError('Item not found.');
            Alert.alert('Error', 'Item not found. It might have been deleted.');
            router.back();
          }
        } catch (e: any) {
          console.error('Failed to load item data:', e);
          setError(e.message || 'Failed to load item data.');
        } finally {
          setIsLoading(false);
        }
      };
      loadItemData();
    }
  }, [itemId, isEditMode, router]);

  const handleSaveItem = async () => {
    setError(null);
    if (!name.trim() || !price.trim() || !quantityInStock.trim()) {
      setError('Name, Price, and Quantity are required.');
      return;
    }

    if (price.includes(',') || !/^\d*\.?\d*$/.test(price)) {
        setError('Please enter a valid price (use dot for decimals)');
        return;
    }

    const numericPrice = parseFloat(price);
    const numericQuantity = parseInt(quantityInStock, 10);
    const numericLowStock = parseInt(lowStockThreshold, 10);

    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError('Price must be a positive number.');
      return;
    }
    if (isNaN(numericQuantity) || numericQuantity < 0) {
      setError('Quantity must be a non-negative number.');
      return;
    }
     if (isNaN(numericLowStock) || numericLowStock < 0) {
      setError('Low stock threshold must be a non-negative number.');
      return;
    }

    const itemData: Omit<Item, 'id'> = {
      name: name.trim(),
      category,
      price: numericPrice,
      quantityInStock: numericQuantity,
      lowStockThreshold: numericLowStock,
    };

    try {
      if (isEditMode && itemId) {
        await updateItem({ ...itemData, id: itemId });
        Alert.alert('Success', 'Item updated successfully!');
      } else {
        await addItem(itemData);
        Alert.alert('Success', 'Item added successfully!');
      }
      router.back();
    } catch (e: any) {
      console.error('Failed to save item:', e);
       if (e.message && e.message.toLowerCase().includes('unique constraint failed')) {
        setError(`An item with the name "${name.trim()}" already exists.`);
      } else {
        setError(e.message || `Failed to ${isEditMode ? 'update' : 'save'} item. Please try again.`);
      }
    }
  };

  if (isLoading && isEditMode) { // Show loading only in edit mode while fetching data
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrange} />
        <Text>Loading item details...</Text>
      </View>
    );
  }

  return (
    <>
    {/* This allows setting screen options from within the component if it's a route component */}
    <Stack.Screen options={{ title: isEditMode ? 'Edit Item' : 'Add New Item' }} />
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.label}>Item Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Red String Hoppers"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Category:</Text>
      <View style={styles.pickerContainer}>
        {Object.values(ItemCategory).map((cat) => (
          <Pressable
            key={cat}
            style={[styles.categoryButton, category === cat && styles.categoryButtonSelected]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.categoryButtonText, category === cat && styles.categoryButtonTextSelected]}>{cat}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Price (Rs.):</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 150.00"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Quantity in Stock:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 50"
        value={quantityInStock}
        onChangeText={setQuantityInStock}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Low Stock Threshold:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 5"
        value={lowStockThreshold}
        onChangeText={setLowStockThreshold}
        keyboardType="number-pad"
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.buttonContainer}>
        <Pressable style={styles.saveButton} onPress={handleSaveItem}>
            <Text style={styles.saveButtonText}>{isEditMode ? 'Update Item' : 'Save Item'}</Text>
        </Pressable>
      </View>
      <View style={styles.buttonContainer}>
         <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </ScrollView>
    </>
  );
}


const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  contentContainer: {
    padding: SIZES.padding,
  },
  label: {
    fontSize: SIZES.h4,
    color: COLORS.secondaryBlack,
    marginBottom: SIZES.base / 2,
    marginTop: SIZES.base * 1.5,
  },
  input: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding / 1.5,
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius,
    borderColor: COLORS.mediumGray,
    borderWidth: 1,
    fontSize: SIZES.body3,
    color: COLORS.primaryBlack,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SIZES.base,
  },
  categoryButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.base * 1.2,
    paddingHorizontal: SIZES.base * 1.8,
    borderRadius: SIZES.radius * 2,
    borderColor: COLORS.primaryOrange,
    borderWidth: 1.5, // Slightly thicker border
    marginRight: SIZES.base,
    marginBottom: SIZES.base,
  },
  categoryButtonSelected: {
    backgroundColor: COLORS.primaryOrange,
    borderColor: COLORS.secondaryOrange, // Different border when selected
  },
  categoryButtonText: {
    color: COLORS.primaryOrange,
    fontSize: SIZES.body4,
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: COLORS.white,
  },
  errorText: {
    color: COLORS.error,
    marginTop: SIZES.base,
    marginBottom: SIZES.base,
    fontSize: SIZES.body4,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: SIZES.padding / 1.5,
  },
  saveButton: {
    backgroundColor: COLORS.primaryOrange,
    paddingVertical: SIZES.padding / 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  saveButtonText: {
      color: COLORS.white,
      fontSize: SIZES.h3,
      fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: COLORS.mediumGray,
    paddingVertical: SIZES.padding / 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  cancelButtonText: {
      color: COLORS.white,
      fontSize: SIZES.h3,
      fontWeight: 'bold',
  }
});
