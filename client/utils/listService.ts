/**
 * List Service - Manages shopping lists in storage
 * Simple implementation without authentication
 * Uses localStorage on web, can be extended with AsyncStorage for native
 */

// Platform-agnostic storage helper
const storage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const value = window.localStorage.getItem(key);
        console.log('🔍 Storage getItem:', { key, hasValue: !!value, valueLength: value?.length || 0 });
        return value;
      }
      console.warn('⚠️ localStorage not available (might be React Native)');
      return null;
    } catch (error) {
      console.error('❌ Error reading from storage:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        console.log('💾 Storage setItem success:', { key, valueLength: value.length });
        // Verify immediately
        const verify = window.localStorage.getItem(key);
        if (verify === value) {
          console.log('✅ Storage verification passed');
        } else {
          console.error('❌ Storage verification failed!');
        }
      } else {
        console.warn('⚠️ localStorage not available (might be React Native)');
      }
    } catch (error) {
      console.error('❌ Error writing to storage:', error);
      // Check if it's a quota exceeded error
      if (error instanceof DOMException && error.code === 22) {
        console.error('❌ Storage quota exceeded!');
      }
    }
  },
};

export interface ListItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  storePrices: Array<{
    rank: number;
    storeName: string;
    price: string;
    storeImage: string;
    isBestDeal?: boolean;
  }>;
  bestPrice?: number;
  bestPriceStore?: string;
  quantity: number;
  addedAt: string;
  notes?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ListItem[];
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_LIST_NAME = 'My Shopping List';
const STORAGE_KEY = 'pricelens-shopping-lists';

/**
 * Get all lists from localStorage
 */
export function getAllLists(): ShoppingList[] {
  try {
    console.log('📖 Reading from storage, key:', STORAGE_KEY);
    const stored = storage.getItem(STORAGE_KEY);
    console.log('📖 Stored value:', stored ? 'exists' : 'null', stored?.substring(0, 100));
    
    if (!stored) {
      console.log('📝 No stored lists, creating default list');
      // Create default list if none exists
      const defaultList: ShoppingList = {
        id: 'default-list',
        name: DEFAULT_LIST_NAME,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveAllLists([defaultList]);
      return [defaultList];
    }
    const parsed = JSON.parse(stored);
    console.log('✅ Parsed lists:', parsed.length, 'lists');
    return parsed;
  } catch (error) {
    console.error('❌ Error reading lists from storage:', error);
    return [];
  }
}

/**
 * Save all lists to storage
 */
function saveAllLists(lists: ShoppingList[]): void {
  try {
    const jsonData = JSON.stringify(lists);
    console.log('💾 Saving to storage:', {
      key: STORAGE_KEY,
      listsCount: lists.length,
      totalItems: lists.reduce((sum, list) => sum + list.items.length, 0),
      dataLength: jsonData.length,
    });
    storage.setItem(STORAGE_KEY, jsonData);
    
    // Verify save
    const verify = storage.getItem(STORAGE_KEY);
    if (verify) {
      console.log('✅ Save verified - data exists in storage');
    } else {
      console.error('❌ Save failed - data not found after save!');
    }
  } catch (error) {
    console.error('❌ Error saving lists to storage:', error);
  }
}

/**
 * Get default list (first list or create one)
 */
export function getDefaultList(): ShoppingList {
  const lists = getAllLists();
  if (lists.length === 0) {
    const defaultList: ShoppingList = {
      id: 'default-list',
      name: DEFAULT_LIST_NAME,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveAllLists([defaultList]);
    return defaultList;
  }
  return lists[0];
}

/**
 * Get or create category-specific list
 */
function getOrCreateCategoryList(category: string): ShoppingList {
  const lists = getAllLists();
  const categoryListName = `${category} List`;
  
  // Try to find existing category list
  let categoryList = lists.find(l => 
    l.name.toLowerCase() === categoryListName.toLowerCase() ||
    l.name.toLowerCase().includes(category.toLowerCase())
  );
  
  if (!categoryList) {
    // Create new category-specific list
    categoryList = {
      id: `list-${category.toLowerCase()}-${Date.now()}`,
      name: categoryListName,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    lists.push(categoryList);
    saveAllLists(lists);
  }
  
  return categoryList;
}

/**
 * Add item to list - smart category detection
 */
export function addItemToList(
  productId: string,
  productName: string,
  productImage: string,
  category: string,
  storePrices: ListItem['storePrices'],
  bestPrice?: number,
  bestPriceStore?: string,
  listId?: string
): { success: boolean; message: string; listName?: string } {
  try {
    console.log('➕ Adding item to list:', {
      productId,
      productName,
      category,
      listId,
    });

    const lists = getAllLists();
    console.log('📋 Current lists before add:', lists.length);
    
    let targetList: ShoppingList;
    
    if (listId) {
      // Use specified list
      targetList = lists.find(l => l.id === listId) || getDefaultList();
    } else {
      // Smart: Use category-specific list or create one
      targetList = getOrCreateCategoryList(category);
    }
    
    console.log('🎯 Target list:', targetList.name, targetList.id);

    console.log('📦 Current items in list:', targetList.items.length);

    // Check if item already exists
    const existingItemIndex = targetList.items.findIndex(
      item => item.productId === productId
    );

    if (existingItemIndex >= 0) {
      console.log('♻️ Item exists, updating quantity');
      // Update quantity if item exists
      targetList.items[existingItemIndex].quantity += 1;
      targetList.items[existingItemIndex].addedAt = new Date().toISOString();
    } else {
      console.log('✨ Adding new item');
      // Add new item
      const newItem: ListItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId,
        productName,
        productImage,
        category,
        storePrices,
        bestPrice,
        bestPriceStore,
        quantity: 1,
        addedAt: new Date().toISOString(),
      };
      targetList.items.push(newItem);
      console.log('✅ Item added:', newItem.id, newItem.productName);
    }

    targetList.updatedAt = new Date().toISOString();
    console.log('💾 Saving lists to storage...');
    saveAllLists(lists);
    
    // Verify save
    const verifyLists = getAllLists();
    const verifyList = verifyLists.find(l => l.id === targetList.id);
    console.log('✅ Verification - Items in list after save:', verifyList?.items.length || 0);

    return { 
      success: true, 
      message: `Added to ${targetList.name}!`,
      listName: targetList.name,
    };
  } catch (error) {
    console.error('❌ Error adding item to list:', error);
    return { success: false, message: `Failed to add item to list: ${error}` };
  }
}

/**
 * Remove item from list
 */
export function removeItemFromList(listId: string, itemId: string): { success: boolean; message: string } {
  try {
    const lists = getAllLists();
    const list = lists.find(l => l.id === listId);
    
    if (!list) {
      return { success: false, message: 'List not found' };
    }

    list.items = list.items.filter(item => item.id !== itemId);
    list.updatedAt = new Date().toISOString();
    saveAllLists(lists);

    return { success: true, message: 'Item removed from list' };
  } catch (error) {
    console.error('Error removing item from list:', error);
    return { success: false, message: 'Failed to remove item' };
  }
}

/**
 * Update item quantity
 */
export function updateItemQuantity(
  listId: string,
  itemId: string,
  quantity: number
): { success: boolean; message: string } {
  try {
    const lists = getAllLists();
    const list = lists.find(l => l.id === listId);
    
    if (!list) {
      return { success: false, message: 'List not found' };
    }

    const item = list.items.find(i => i.id === itemId);
    if (!item) {
      return { success: false, message: 'Item not found' };
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      return removeItemFromList(listId, itemId);
    }

    item.quantity = quantity;
    list.updatedAt = new Date().toISOString();
    saveAllLists(lists);

    return { success: true, message: 'Quantity updated' };
  } catch (error) {
    console.error('Error updating item quantity:', error);
    return { success: false, message: 'Failed to update quantity' };
  }
}

/**
 * Get list by ID
 */
export function getListById(listId: string): ShoppingList | null {
  const lists = getAllLists();
  return lists.find(l => l.id === listId) || null;
}

/**
 * Calculate total cost for a list
 */
export function calculateListTotal(list: ShoppingList): {
  total: number;
  byStore: Record<string, number>;
} {
  const byStore: Record<string, number> = {};
  let total = 0;

  list.items.forEach(item => {
    if (item.bestPrice) {
      const itemTotal = item.bestPrice * item.quantity;
      total += itemTotal;
      
      if (item.bestPriceStore) {
        byStore[item.bestPriceStore] = (byStore[item.bestPriceStore] || 0) + itemTotal;
      }
    }
  });

  return { total, byStore };
}

/**
 * Create a new list
 */
export function createList(name: string): ShoppingList {
  const lists = getAllLists();
  const newList: ShoppingList = {
    id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  lists.push(newList);
  saveAllLists(lists);
  return newList;
}

/**
 * Delete a list
 */
export function deleteList(listId: string): { success: boolean; message: string } {
  try {
    const lists = getAllLists();
    const filtered = lists.filter(l => l.id !== listId);
    
    if (filtered.length === lists.length) {
      return { success: false, message: 'List not found' };
    }

    saveAllLists(filtered);
    return { success: true, message: 'List deleted' };
  } catch (error) {
    console.error('Error deleting list:', error);
    return { success: false, message: 'Failed to delete list' };
  }
}

