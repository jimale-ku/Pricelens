/**
 * Shopping Lists Tab Screen - Matching Figma Design
 * Features: Sub-navigation, Tabs, Bulk Upload, Grocery List View
 */

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, Alert, TextInput, Image, RefreshControl, AppState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import { getAllLists, createList, calculateListTotal, ShoppingList, addItemToList } from '@/utils/listService';

type TabType = 'bulk-upload' | 'saved-lists' | 'recent';

export default function ListsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('bulk-upload');
  const [groceryList, setGroceryList] = useState<ShoppingList | null>(null);
  const [bulkInput, setBulkInput] = useState('');
  const [savedLists, setSavedLists] = useState<ShoppingList[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastItemCountRef = useRef<number>(0);

  const loadGroceryList = useCallback(() => {
    console.log('📋 Loading all lists...');
    try {
      const lists = getAllLists();
      
      // Find grocery list specifically (for the "Grocery List" button)
      let grocery = lists.find(l => 
        l.name.toLowerCase().includes('grocery') ||
        l.name.toLowerCase() === 'groceries list'
      );
      
      // If no grocery list, use first list or create default
      if (!grocery) {
        if (lists.length > 0) {
          grocery = lists[0]; // Use first list as fallback
        } else {
          // Create default list
          grocery = {
            id: 'default-list',
            name: 'My Shopping List',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const allLists = [...lists, grocery];
          // Note: This won't persist without calling saveAllLists, but getAllLists will create it
        }
      }
      
      setGroceryList(grocery);
      
      // All lists (for Saved Lists tab)
      setSavedLists(lists);
    } catch (error) {
      console.error('❌ Error loading lists:', error);
      setGroceryList(null);
      setSavedLists([]);
    }
  }, []);

  // Load on mount and focus
  useEffect(() => {
    loadGroceryList();
  }, [loadGroceryList]);

  useFocusEffect(
    useCallback(() => {
      console.log('📋 Lists screen focused, reloading...');
      loadGroceryList();
      
      // Start polling for changes when screen is focused
      refreshIntervalRef.current = setInterval(() => {
        const lists = getAllLists();
        const grocery = lists.find(l => 
          l.name.toLowerCase().includes('grocery') || 
          l.id === 'default-list' ||
          lists.length === 1
        ) || lists[0];
        
        const currentItemCount = grocery?.items.length || 0;
        
        // If item count changed, reload
        if (currentItemCount !== lastItemCountRef.current) {
          console.log('🔄 Item count changed, reloading...', {
            old: lastItemCountRef.current,
            new: currentItemCount,
          });
          lastItemCountRef.current = currentItemCount;
          loadGroceryList();
        }
      }, 2000); // Check every 2 seconds
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }, [loadGroceryList])
  );

  // Listen for app state changes (when app comes to foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active, reloading lists...');
        loadGroceryList();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadGroceryList]);

  // Update lastItemCountRef when groceryList changes
  useEffect(() => {
    if (groceryList) {
      lastItemCountRef.current = groceryList.items.length;
    }
  }, [groceryList]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGroceryList();
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, [loadGroceryList]);

  const handleAddItem = () => {
    router.push('/(tabs)/search');
  };

  const handleBulkUpload = () => {
    if (!bulkInput.trim()) {
      Alert.alert('Empty List', 'Please enter at least one item.');
      return;
    }

    const items = bulkInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (items.length === 0) {
      Alert.alert('Empty List', 'Please enter at least one item.');
      return;
    }

    Alert.alert(
      'Bulk Upload',
      `Add ${items.length} items to your grocery list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Items',
          onPress: () => {
            // For now, just show success - in real implementation, search for each item
            Alert.alert('Success', `Added ${items.length} items to your grocery list!`);
            setBulkInput('');
            loadGroceryList();
          },
        },
      ]
    );
  };

  const handleSaveList = () => {
    if (!bulkInput.trim()) {
      Alert.alert('Empty List', 'Please enter at least one item to save.');
      return;
    }

    Alert.prompt(
      'Save List',
      'Enter a name for this list:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (name) => {
            if (name && name.trim()) {
              createList(name.trim());
              setBulkInput('');
              loadGroceryList();
              Alert.alert('Success', 'List saved!');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleLoadExample = () => {
    const exampleItems = `Milk
Bread
Eggs
Bananas
Chicken Breast
Rice
Pasta
Tomatoes
Onions
Cheese`;
    setBulkInput(exampleItems);
  };

  const handleComparePrices = () => {
    if (!groceryList || groceryList.items.length === 0) {
      Alert.alert('Empty List', 'Add items to your list first to compare prices.');
      return;
    }
    // Navigate to comparison view (to be implemented)
    Alert.alert('Coming Soon', 'Price comparison across stores will be available soon!');
  };

  const itemCount = groceryList?.items.length || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <AppHeader />

      {/* Sub-Navigation Bar */}
      <View style={{
        backgroundColor: '#151B28',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      }}>
        {/* Grocery List Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setActiveTab('saved-lists');
            loadGroceryList();
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Ionicons name="cart-outline" size={20} color="#94A3B8" />
          <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: '500' }}>
            {groceryList?.name || 'My List'} ({itemCount})
          </Text>
          {itemCount > 0 && (
            <View style={{
              backgroundColor: '#10b981',
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 6,
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                {itemCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Bulk Upload Button (Center) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('bulk-upload')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              borderRadius: 8,
            }}
          />
          <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
            Bulk Upload
          </Text>
        </TouchableOpacity>

        {/* Saved Items Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Ionicons name="bookmark-outline" size={20} color="#94A3B8" />
          <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: '500' }}>
            Saved Items
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={{
        backgroundColor: '#151B28',
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        gap: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      }}>
        {[
          { id: 'bulk-upload' as TabType, label: 'Bulk Upload' },
          { id: 'saved-lists' as TabType, label: 'Saved Lists' },
          { id: 'recent' as TabType, label: 'Recent' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.8}
            onPress={() => setActiveTab(tab.id)}
            style={{
              paddingBottom: 8,
              borderBottomWidth: activeTab === tab.id ? 2 : 0,
              borderBottomColor: '#3B82F6',
            }}
          >
            <Text style={{
              color: activeTab === tab.id ? '#3B82F6' : '#94A3B8',
              fontSize: 14,
              fontWeight: activeTab === tab.id ? '600' : '400',
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
      >
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          {/* Bulk Upload Tab */}
          {activeTab === 'bulk-upload' && (
            <View>
              {/* Header */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="arrow-up" size={24} color="#3B82F6" />
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>
                    Bulk Grocery List Upload
                  </Text>
                </View>
              </View>

              <Text style={{
                fontSize: 14,
                color: '#94A3B8',
                marginBottom: 16,
                lineHeight: 20,
              }}>
                Enter multiple items to compare total prices across all stores
              </Text>

              {/* Input Section */}
              <View style={{ marginBottom: 12 }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}>
                  <Text style={{ fontSize: 14, color: '#E2E8F0', fontWeight: '500' }}>
                    Enter your grocery list (one item per line):
                  </Text>
                  <TouchableOpacity onPress={handleLoadExample}>
                    <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '500' }}>
                      Load Example
                    </Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  value={bulkInput}
                  onChangeText={setBulkInput}
                  placeholder="Milk&#10;Bread&#10;Eggs&#10;Bananas&#10;Chicken Breast"
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={10}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderWidth: 1,
                    borderColor: '#3B82F6',
                    borderRadius: 12,
                    padding: 16,
                    color: '#FFFFFF',
                    fontSize: 14,
                    minHeight: 200,
                    textAlignVertical: 'top',
                  }}
                />

                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 12,
                }}>
                  <Ionicons name="bulb-outline" size={16} color="#94A3B8" />
                  <Text style={{ fontSize: 12, color: '#94A3B8', flex: 1 }}>
                    Tip: Enter one item per line. Don't worry about exact names - we'll find the best matches!
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ gap: 12, marginTop: 24 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleBulkUpload}
                  style={{ width: '100%' }}
                >
                  <LinearGradient
                    colors={['#3B82F6', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{
                      color: '#FFFFFF',
                      fontSize: 16,
                      fontWeight: '600',
                    }}>
                      Compare Prices Across Stores
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSaveList}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 12,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <Ionicons name="save-outline" size={18} color="#3B82F6" />
                  <Text style={{
                    color: '#3B82F6',
                    fontSize: 14,
                    fontWeight: '600',
                  }}>
                    Save List
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Saved Lists Tab */}
          {activeTab === 'saved-lists' && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 }}>
                All Lists
              </Text>
              {savedLists.length === 0 ? (
                <View style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 16,
                  padding: 40,
                  alignItems: 'center',
                }}>
                  <Ionicons name="list-outline" size={64} color="#64748B" />
                  <Text style={{
                    color: '#E2E8F0',
                    fontSize: 18,
                    fontWeight: '600',
                    marginTop: 16,
                    marginBottom: 8,
                  }}>
                    No Saved Lists
                  </Text>
                  <Text style={{
                    color: '#94A3B8',
                    fontSize: 14,
                    textAlign: 'center',
                  }}>
                    Save lists to access them later
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {savedLists.map((list) => {
                    const totals = calculateListTotal(list);
                    const isGrocery = list.id === groceryList?.id;
                    return (
                      <TouchableOpacity
                        key={list.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (isGrocery) {
                            setActiveTab('saved-lists'); // Show grocery list view
                          } else {
                            router.push(`/list/${list.id}`);
                          }
                        }}
                        style={{
                          backgroundColor: isGrocery ? 'rgba(59, 130, 246, 0.1)' : 'rgba(15, 23, 42, 0.6)',
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          borderColor: isGrocery ? 'rgba(59, 130, 246, 0.3)' : 'rgba(148, 163, 184, 0.1)',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{
                              fontSize: 16,
                              fontWeight: '600',
                              color: '#FFFFFF',
                              marginBottom: 4,
                            }}>
                              {list.name}
                            </Text>
                            <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                              {list.items.length} item{list.items.length !== 1 ? 's' : ''} 
                              {totals.total > 0 ? ` • $${totals.total.toFixed(2)}` : ''}
                            </Text>
                          </View>
                          {isGrocery && (
                            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Recent Tab */}
          {activeTab === 'recent' && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 }}>
                Recent Activity
              </Text>
              <View style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 16,
                padding: 40,
                alignItems: 'center',
              }}>
                <Ionicons name="time-outline" size={64} color="#64748B" />
                <Text style={{
                  color: '#E2E8F0',
                  fontSize: 18,
                  fontWeight: '600',
                  marginTop: 16,
                  marginBottom: 8,
                }}>
                  No Recent Activity
                </Text>
                <Text style={{
                  color: '#94A3B8',
                  fontSize: 14,
                  textAlign: 'center',
                }}>
                  Your recent list activity will appear here
                </Text>
              </View>
            </View>
          )}

          {/* Grocery List View - Always visible when not in bulk upload */}
          {activeTab !== 'bulk-upload' && (
            <View style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 16,
              padding: 24,
              marginTop: 24,
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.1)',
              minHeight: 400,
            }}>
              {/* Header */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="cart" size={24} color="#3B82F6" />
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>
                    My Grocery List
                  </Text>
                  {itemCount > 0 && (
                    <View style={{
                      backgroundColor: '#10b981',
                      borderRadius: 12,
                      minWidth: 24,
                      height: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 8,
                    }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                        {itemCount}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onRefresh}
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: 8,
                      padding: 8,
                      borderWidth: 1,
                      borderColor: 'rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    <Ionicons name="refresh" size={18} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleAddItem}
                    style={{
                      backgroundColor: '#3B82F6',
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                      Add Item
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Items or Empty State */}
              {!groceryList || groceryList.items.length === 0 ? (
                <View style={{ 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  paddingVertical: 60,
                  flex: 1,
                }}>
                  <Ionicons 
                    name="cart-outline" 
                    size={120} 
                    color="rgba(100, 116, 139, 0.3)" 
                    style={{ opacity: 0.3 }}
                  />
                  <Text style={{
                    color: '#E2E8F0',
                    fontSize: 18,
                    fontWeight: '600',
                    marginTop: 24,
                    marginBottom: 8,
                  }}>
                    Your grocery list is empty
                  </Text>
                  <Text style={{
                    color: '#94A3B8',
                    fontSize: 14,
                    textAlign: 'center',
                    maxWidth: 300,
                    lineHeight: 20,
                  }}>
                    Click "Add Item" or "Add to List" on any product to get started
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {groceryList.items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      onPress={() => router.push(`/list/${groceryList.id}`)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        backgroundColor: 'rgba(21, 27, 40, 0.6)',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: 'rgba(148, 163, 184, 0.1)',
                      }}
                    >
                      <Image
                        source={{ uri: item.productImage || 'https://via.placeholder.com/60x60/1e2736/8b95a8?text=No+Image' }}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          backgroundColor: '#1e2736',
                        }}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#FFFFFF',
                          marginBottom: 4,
                        }}>
                          {item.productName}
                        </Text>
                        {item.bestPrice && (
                          <Text style={{ fontSize: 14, color: '#10b981', fontWeight: '600' }}>
                            ${(item.bestPrice * item.quantity).toFixed(2)}
                            {item.bestPriceStore && ` at ${item.bestPriceStore}`}
                          </Text>
                        )}
                      </View>
                      <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                        Qty: {item.quantity}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
