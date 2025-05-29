// your-expo-project/app/add-item.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ItemCategory } from '../models/item.model'; // Adjust path
import { addItem } from '../data/database'; // Adjust path
import { COLORS, SIZES } from '../constants/theme'; // Adjust path
// If you want a Picker for categories:
// import { Picker } from '@react-native-picker/picker'; // npm install @react-native-picker/picker

export default function AddItemScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>(ItemCategory.MAIN); // Default category
  const [price, setPrice] = useState('');
  const [quantityInStock, setQuantityInStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5'); // Default low stock
  const [error, setError] = useState<string | null>(null);

  const handleSaveItem = async () => {
    setError(null);
    if (!name.trim() || !price.trim() || !quantityInStock.trim()) {
      setError('Name, Price, and Quantity are required.');
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

    try {
      await addItem({
        name: name.trim(),
        category,
        price: numericPrice,
        quantityInStock: numericQuantity,
        lowStockThreshold: numericLowStock,
      });
      Alert.alert('Success', 'Item added successfully!');
      router.back(); // Go back to the item management screen
      // You might want to add a way to refresh the list on the previous screen
    } catch (e: any) {
      console.error('Failed to save item:', e);
      if (e.message && e.message.toLowerCase().includes('unique constraint failed')) {
        setError(`An item with the name "${name.trim()}" already exists.`);
      } else {
        setError(e.message || 'Failed to save item. Please try again.');
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.label}>Item Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Red String Hoppers"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Category:</Text>
      {/* Basic Text Input for Category - For a Picker, see comments below */}
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
      {/*
      // Alternative: Using @react-native-picker/picker
      // <View style={styles.pickerWrapper}>
      //   <Picker
      //     selectedValue={category}
      //     onValueChange={(itemValue) => setCategory(itemValue as ItemCategory)}
      //     style={styles.picker}
      //   >
      //     {Object.values(ItemCategory).map((cat) => (
      //       <Picker.Item key={cat} label={cat} value={cat} />
      //     ))}
      //   </Picker>
      // </View>
      */}


      <Text style={styles.label}>Price ($):</Text>
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
        <Button title="Save Item" onPress={handleSaveItem} color={COLORS.primaryOrange} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Cancel" onPress={() => router.back()} color={COLORS.mediumGray} />
      </View>
    </ScrollView>
  );
}

// Add Pressable to imports from 'react-native' if you use the custom category picker
import { Pressable } from 'react-native';

const styles = StyleSheet.create({
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
  // Styles for custom category picker using Pressable
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
    borderWidth: 1,
    marginRight: SIZES.base,
    marginBottom: SIZES.base,
  },
  categoryButtonSelected: {
    backgroundColor: COLORS.primaryOrange,
  },
  categoryButtonText: {
    color: COLORS.primaryOrange,
    fontSize: SIZES.body4,
  },
  categoryButtonTextSelected: {
    color: COLORS.white, // Or primaryBlack if it looks better
  },
  // Styles for @react-native-picker/picker
  // pickerWrapper: {
  //   backgroundColor: COLORS.white,
  //   borderRadius: SIZES.radius,
  //   borderColor: COLORS.mediumGray,
  //   borderWidth: 1,
  //   overflow: 'hidden', //
  // },
  // picker: {
  //   // height: 50, // Adjust as needed
  //   // width: '100%',
  //   color: COLORS.primaryBlack,
  // },
  errorText: {
    color: COLORS.error,
    marginTop: SIZES.base,
    marginBottom: SIZES.base,
    fontSize: SIZES.body4,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: SIZES.padding,
  }
});