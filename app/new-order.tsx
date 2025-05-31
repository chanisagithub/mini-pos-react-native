// your-expo-project/app/new-order.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, SectionList, // Changed from FlatList/ScrollView
  Pressable, Alert, ActivityIndicator
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Item, getItems } from '../data/database';
import { CartItem, saveCompleteOrder } from '../data/database';
import { COLORS, SIZES } from '../constants/theme';

// Import the types defined above (or define them here)
// For simplicity, I'll assume they are defined in this file or imported.
// Ensure Item and CartItem models have an `id: number | string` that can be stringified for keys.
// If Item.id is number?, we'll handle it in keyExtractor or by mapping data.

export default function NewOrderScreen() {
  const router = useRouter();
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Existing Logic (fetchAvailableItems, handleAddItemToCart, handleUpdateCartQuantity, calculateTotal, handleSaveOrder) ---
  // This logic remains mostly the same. Ensure it updates the `availableItems` and `cart` states correctly.

  const fetchAvailableItems = useCallback(async () => {
    setIsLoadingItems(true);
    try {
      const itemsFromDb = await getItems();
      setAvailableItems(itemsFromDb);
    } catch (error) {
      console.error("Failed to fetch available items:", error);
      Alert.alert("Error", "Could not load items.");
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailableItems();
  }, [fetchAvailableItems]);

const handleAddItemToCart = (itemFromSectionList: AvailableItemDataType, quantity: number = 1) => {
    if (quantity <= 0) return;

    // Use the originalNumericId for all logic related to the cart state
    const numericItemId = itemFromSectionList.originalNumericId;

    // Stock check uses quantityInStock from itemFromSectionList (which is the item's current total stock)
    if (itemFromSectionList.quantityInStock < quantity) {
        Alert.alert("Out of Stock", `Only ${itemFromSectionList.quantityInStock} of ${itemFromSectionList.name} available.`);
        return;
    }

    setCart(prevCart => {
        // prevCart items now have numeric IDs
        const existingItemIndex = prevCart.findIndex(cartItem => cartItem.id === numericItemId);

        if (existingItemIndex > -1) {
            const updatedCart = [...prevCart];
            const currentCartItem = updatedCart[existingItemIndex];
            const newQuantity = currentCartItem.orderQuantity + quantity;

            // Check against actual stock (from itemFromSectionList, which is the source of truth for stock)
            if (itemFromSectionList.quantityInStock < newQuantity) {
                Alert.alert("Out of Stock", `Cannot add ${quantity} more. Only ${itemFromSectionList.quantityInStock - currentCartItem.orderQuantity} additional ${itemFromSectionList.name} available.`);
                return prevCart;
            }
            updatedCart[existingItemIndex].orderQuantity = newQuantity;
            return updatedCart;
        } else {
            // Add to cart with NUMERIC ID and other necessary properties from itemFromSectionList
            const newItemForCart: CartItem = {
                id: numericItemId, // CRITICAL: Use the numeric ID
                name: itemFromSectionList.name,
                category: itemFromSectionList.category,
                price: itemFromSectionList.price,
                quantityInStock: itemFromSectionList.quantityInStock, // Item's current total stock
                lowStockThreshold: itemFromSectionList.lowStockThreshold,
                // imageUri: itemFromSectionList.imageUri, // if you have it
                orderQuantity: quantity,
            };
            return [...prevCart, newItemForCart];
        }
    });
};

const handleUpdateCartQuantity = (itemId: number, newQuantityAttempt: number) => {
    console.log(`[handleUpdateCartQuantity] Called. ItemID (number): ${itemId}, NewQuantityAttempt: ${newQuantityAttempt}`);

    const itemInStock = availableItems.find(item => item.id === itemId);
    if (!itemInStock) {
        console.warn(`[handleUpdateCartQuantity] CRITICAL: Item with ID ${itemId} not found in availableItems for stock check. availableItems IDs:`, availableItems.map(i=>i.id));
        return; // Can't proceed without stock info
    }
    console.log(`[handleUpdateCartQuantity] Stock info found for ${itemInStock.name}: ${itemInStock.quantityInStock} available.`);

    let newQuantity = newQuantityAttempt;

    if (newQuantity < 0) { // Should not happen with parseInt(text) || 0 but good to guard
        newQuantity = 0; // Treat negative as 0
    }

    if (newQuantity === 0) { // Handles explicit 0 or cleared/invalid input
      console.log(`[handleUpdateCartQuantity] Quantity is 0 for item ${itemId}. Removing from cart.`);
      setCart(prevCart => {
        const updatedCart = prevCart.filter(cartItem => cartItem.id !== itemId);
        console.log('[handleUpdateCartQuantity] Cart after removal (qty 0):', updatedCart.map(ci => ({id: ci.id, qty: ci.orderQuantity})));
        return updatedCart;
      });
      return;
    }

    if (itemInStock.quantityInStock < newQuantity) {
        Alert.alert("Stock Limit", `Only ${itemInStock.quantityInStock} of ${itemInStock.name} available. Quantity set to max available.`);
        newQuantity = itemInStock.quantityInStock; // Cap the quantity
        console.log(`[handleUpdateCartQuantity] Quantity for item ${itemId} capped at: ${newQuantity} due to stock limit.`);
    }

    // If, after capping, quantity is 0 (e.g., stock was 0), remove it.
    if (newQuantity === 0) {
      console.log(`[handleUpdateCartQuantity] Quantity became 0 after capping for item ${itemId}. Removing from cart.`);
      setCart(prevCart => {
        const updatedCart = prevCart.filter(cartItem => cartItem.id !== itemId);
        console.log('[handleUpdateCartQuantity] Cart after removal (post-cap qty 0):', updatedCart.map(ci => ({id: ci.id, qty: ci.orderQuantity})));
        return updatedCart;
      });
      return;
    }


      console.log(`[handleUpdateCartQuantity] Proceeding to update cart. ItemID (number): ${itemId}, Final NewQuantity: ${newQuantity}`);
      setCart(prevCart => {
        let itemFoundAndUpdated = false;
        const updatedCart = prevCart.map(cartItem => {
          // --- NEW DETAILED LOGGING FOR ID COMPARISON ---
          console.log(
            `[Debug Cart Update] Comparing: cartItem.id = "${cartItem.id}" (type: ${typeof cartItem.id}) ` +
            `vs. itemId = "${itemId}" (type: ${typeof itemId})`
          );
          // --- END NEW DETAILED LOGGING ---

          if (cartItem.id === itemId) { // This is the critical comparison
            console.log(`[handleUpdateCartQuantity] setCart map: MATCH FOUND for ID ${itemId}! Updating quantity from ${cartItem.orderQuantity} to ${newQuantity}.`);
            itemFoundAndUpdated = true;
            return { ...cartItem, orderQuantity: newQuantity };
          }
          return cartItem;
        });

        if (!itemFoundAndUpdated) {
          console.warn(`[handleUpdateCartQuantity] setCart map: NO MATCH FOUND for item ID ${itemId} in cart. Current cart item details:`,
            prevCart.map(ci => ({ id: ci.id, type: typeof ci.id, name: ci.name }))
          );
        }
        // console.log('[handleUpdateCartQuantity] Cart state after this update attempt:', updatedCart.map(ci => ({id: ci.id, qty: ci.orderQuantity}))); // Old log
        return updatedCart;
      });
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.orderQuantity, 0);
  };

  const handleSaveOrder = async () => {
    if (!customerName.trim()) {
      Alert.alert("Missing Information", "Please enter the customer's name.");
      return;
    }
    if (cart.length === 0) {
      Alert.alert("Empty Order", "Please add items to the order.");
      return;
    }
    setIsSavingOrder(true);
    try {
      await saveCompleteOrder(customerName.trim(), cart);
      Alert.alert("Success", "Order saved successfully!");
      setCart([]);
      setCustomerName('');
      setSearchTerm(''); // Clear search term as well
      fetchAvailableItems();
    } catch (e: any) {
      console.error("Failed to save order:", e);
      Alert.alert("Error Saving Order", e.message || "Could not save the order. Please check stock levels or try again.");
    } finally {
      setIsSavingOrder(false);
    }
  };

  // --- Prepare data for SectionList ---
  const filteredAvailableItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) && item.quantityInStock > 0
  );

  const sections: OrderSection[] = [
    {
      key: 'customer_info',
      title: 'Customer Name',
      data: [{ id: 'customer_name_input', type: 'customer_name' } as SectionListItemData],
    },
    {
      key: 'available_items_search',
      title: 'Available Items', // Title for the search bar section
      data: [{ id: 'search_bar_input', type: 'search_bar' } as SectionListItemData],
    },
    // Section for AVAILABLE ITEMS LIST
    ...(isLoadingItems
      ? [{ key: 'loading_available', data: [{ id: 'loading_placeholder', type: 'empty_placeholder', message: 'Loading items...' } as SectionListItemData] }]
      : filteredAvailableItems.length > 0
        ? [{
            key: 'filtered_items_list', // Key for the section containing the list itself
            // No title here if the "Available Items" title is handled by the search bar section above
            data: filteredAvailableItems.map(
              item => ({ // item here is an original Item object from availableItems (numeric id)
                  ...item, // Spread all properties of original Item
                  originalNumericId: item.id!, // Store original numeric ID
                  id: item.id!.toString(),      // String ID for SectionList
                  type: 'available_item'        // Set the type
              } as SectionListItemData)         // Cast to the base type
            ),
          }]
        : [{ key: 'no_available_items', data: [{ id: 'no_items_placeholder', type: 'empty_placeholder', message: 'No items available or match your search.' } as SectionListItemData]}]
    ),
    {
      key: 'current_order_title',
      title: 'Current Order',
      data: [], // This section just provides the title "Current Order"
    },
    // Section for CART ITEMS LIST
    ...(cart.length > 0
      ? [{
          key: 'cart_items_list', // Key for the section containing the cart items
          // No title here if "Current Order" title is handled by the section above
          data: cart.map(
            cartStateItem => ({ // cartStateItem is from cart state, cartStateItem.id is NUMBER
                ...cartStateItem,
                originalNumericId: cartStateItem.id,    // Store numeric ID from cart
                id: cartStateItem.id.toString(),        // Stringify for SectionList item.id
                type: 'cart_item'                       // Set the type
            } as SectionListItemData)                   // Cast to the base type
          ),
        }]
      : [{ key: 'empty_cart', data: [{ id: 'empty_cart_placeholder', type: 'empty_placeholder', message: 'Cart is empty. Add items from above.' } as SectionListItemData] }]
    ),
    {
      key: 'order_summary_actions',
      data: [
        { id: 'order_total_display', type: 'order_total', total: calculateTotal() } as SectionListItemData,
        { id: 'action_buttons_group', type: 'action_buttons' } as SectionListItemData,
      ],
    },
  ];


  // --- Render logic for SectionList ---
  const renderSectionItem = ({ item, section }: { item: SectionListItemData, section: OrderSection }) => {
    switch (item.type) {
      case 'customer_name':
        return (
          <TextInput
            style={styles.inputPadded} // Use a style with padding for section items
            placeholder="Enter customer name"
            value={customerName}
            onChangeText={setCustomerName}
          />
        );

        case 'cart_item':
            const cartItemData = item as CartListItemDataType; // cartItemData.id is STRING, originalNumericId is NUMBER
            return (
              <View style={styles.cartItem}>
                <Text style={styles.cartItemName}>{cartItemData.itemName || cartItemData.name}</Text>
                <View style={styles.cartItemDetails}>
                  <Text>Rs. {cartItemData.price.toFixed(2)} x </Text>
                  <TextInput
                      style={styles.quantityInput}
                      value={cartItemData.orderQuantity.toString()}
                      onChangeText={(text) => {
                        // Use originalNumericId (which is a number) for handleUpdateCartQuantity
                        const currentNumericItemId = cartItemData.originalNumericId;
                        const newAttemptedQuantity = parseInt(text);

                        if (isNaN(newAttemptedQuantity) && text !== "") {
                          handleUpdateCartQuantity(currentNumericItemId, 0);
                          return;
                        }
                        const quantityToUpdate = isNaN(newAttemptedQuantity) ? 0 : newAttemptedQuantity;
                        handleUpdateCartQuantity(currentNumericItemId, quantityToUpdate);
                      }}
                      keyboardType="number-pad"
                      maxLength={3}
                  />
                  <Text>= Rs. {(cartItemData.price * cartItemData.orderQuantity).toFixed(2)}</Text>
                  <Pressable
                    onPress={() => {
                      // Use originalNumericId (which is a number) for handleUpdateCartQuantity
                      handleUpdateCartQuantity(cartItemData.originalNumericId, 0); // To delete
                    }}
                    style={styles.deleteCartItemButton}
                  >
                       <Text style={styles.deleteCartItemButtonText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            );
      case 'search_bar':
        return (
          <TextInput
            style={styles.inputPadded}
            placeholder="Search items..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        );
      case 'available_item':
        const availableItem = item as AvailableItemDataType;
        return (
          <Pressable onPress={() => handleAddItemToCart(availableItem, 1)} style={styles.availableItem}>
            <Text style={styles.availableItemName}>{availableItem.name} (Stock: {availableItem.quantityInStock})</Text>
            <Text style={styles.availableItemPrice}>Rs. {availableItem.price.toFixed(2)}</Text>
          </Pressable>
        );

      case 'order_total':
        const totalData = item as OrderTotalDataType;
        return <Text style={styles.totalText}>Total: Rs. {totalData.total.toFixed(2)}</Text>;
      case 'action_buttons':
        return (
          <View style={styles.actionsGroup}>
            <Pressable
              style={[styles.actionButton, styles.saveButton, isSavingOrder && styles.disabledButton]}
              onPress={handleSaveOrder}
              disabled={isSavingOrder}>
              <Text style={styles.actionButtonText}>{isSavingOrder ? "Saving..." : "Save Order"}</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.clearButton]}
              onPress={() => { setCart([]); setCustomerName(''); setSearchTerm(''); }}
              disabled={isSavingOrder}>
              <Text style={styles.actionButtonText}>Clear Order</Text>
            </Pressable>
          </View>
        );
      case 'empty_placeholder':
        const placeholderData = item as EmptyPlaceholderDataType;
        if (placeholderData.id === 'loading_placeholder' && isLoadingItems) {
            return <ActivityIndicator size="large" color={COLORS.primaryOrange} style={{ marginVertical: 20 }} />;
        }
        return <Text style={styles.emptyListText}>{placeholderData.message}</Text>;
      default:
        return null;
    }
  };

  const renderSectionHeader = ({ section }: { section: OrderSection }) => {
    if (!section.title) return null;
    // Skip rendering header for sections that are just lists of items if title is handled by previous section
    if (section.key === 'filtered_items_list' || section.key === 'cart_items_list' ||
        section.key === 'no_available_items' || section.key === 'empty_cart' ||
        (section.key === 'loading_available' && !isLoadingItems)) return null;


    return <Text style={styles.sectionTitle}>{section.title}</Text>;
  };


  return (
    <>
      <Stack.Screen options={{ title: 'Create New Order' }} />
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.id + index} // item.id should be unique within its original list
        renderItem={renderSectionItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false} // Personal preference
        style={styles.container} // Apply container style to SectionList
        contentContainerStyle={styles.contentContainer} // For padding at the very bottom
        ListEmptyComponent={ isLoadingItems ? <ActivityIndicator size="large" color={COLORS.primaryOrange} /> : null} // Fallback if sections array is empty
      />
    </>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { // Applied to SectionList
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  contentContainer: { // For SectionList's content (padding at bottom)
    paddingBottom: SIZES.padding * 2, // Ensure space for last items/buttons
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.primaryBlack,
    backgroundColor: COLORS.white, // Give headers a distinct background
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 1.5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  inputPadded: { // For inputs rendered as section items
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 1.5, // Consistent padding
    fontSize: SIZES.body3,
    color: COLORS.primaryBlack,
    borderBottomWidth: 1, // Separator for these items
    borderBottomColor: COLORS.lightGray,
  },
  availableItem: {
    paddingVertical: SIZES.base * 1.5,
    paddingHorizontal: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
  },
  availableItemName: { fontSize: SIZES.body3, color: COLORS.primaryBlack, flex:1 },
  availableItemPrice: { fontSize: SIZES.body3, color: COLORS.secondaryBlack, fontWeight: 'bold' },
  cartItem: {
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  cartItemName: { fontSize: SIZES.body3, fontWeight: 'bold', color: COLORS.primaryBlack },
  cartItemDetails: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SIZES.base / 2 },
  quantityInput: {
    borderWidth: 1, borderColor: COLORS.mediumGray, borderRadius: SIZES.radius / 2,
    paddingHorizontal: SIZES.base, paddingVertical: SIZES.base / 2,
    width: 50, textAlign: 'center', fontSize: SIZES.body4, marginHorizontal: SIZES.base / 2,
  },
  deleteCartItemButton: { padding: SIZES.base / 2, marginLeft: SIZES.base },
  deleteCartItemButtonText: { fontSize: SIZES.h3, color: COLORS.error },
  totalText: {
    fontSize: SIZES.h2, fontWeight: 'bold', textAlign: 'right',
    paddingHorizontal: SIZES.padding, paddingVertical: SIZES.padding,
    color: COLORS.primaryOrange, backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.mediumGray,
  },
  actionsGroup: { // Container for action buttons
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 1.5,
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.mediumGray,
  },
  actionButton: {
    paddingVertical: SIZES.padding / 1.2, borderRadius: SIZES.radius,
    alignItems: 'center', marginBottom: SIZES.base,
  },
  saveButton: { backgroundColor: COLORS.primaryOrange },
  clearButton: { backgroundColor: COLORS.mediumGray },
  actionButtonText: { color: COLORS.white, fontSize: SIZES.h3, fontWeight: 'bold' },
  disabledButton: { opacity: 0.7 },
  emptyListText: {
    textAlign: 'center', color: COLORS.mediumGray,
    paddingHorizontal: SIZES.padding, paddingVertical: SIZES.padding * 1.5, // More padding for placeholders
    fontSize: SIZES.body3, backgroundColor: COLORS.white,
  },
});