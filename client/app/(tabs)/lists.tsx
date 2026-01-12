/**
 * Shopping Lists Tab Screen
 */

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '@/components/AppHeader';

export default function ListsScreen() {
  // Mock shopping lists data
  const shoppingLists = [
    { id: '1', name: 'Weekly Groceries', itemCount: 12, lastUpdated: '2 hours ago' },
    { id: '2', name: 'Electronics Wishlist', itemCount: 5, lastUpdated: '1 day ago' },
    { id: '3', name: 'Home Decor', itemCount: 8, lastUpdated: '3 days ago' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <AppHeader />

        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          {/* Header */}
          <View style={{
            backgroundColor: 'rgba(21, 27, 40, 0.6)',
            borderRadius: 16,
            padding: 24,
            borderWidth: 1.5,
            borderColor: 'rgba(139, 149, 168, 0.15)',
            marginBottom: 24,
            overflow: 'hidden',
          }}>
            <LinearGradient
              colors={['rgba(6, 182, 212, 0.1)', 'rgba(139, 92, 246, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <Ionicons name="list" size={32} color="#06B6D4" />
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>
                My Shopping Lists
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: '#94A3B8', lineHeight: 20 }}>
              Organize your shopping and track items across different stores
            </Text>
          </View>

          {/* Create New List Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={{ marginBottom: 24 }}
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
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
              }}>
                Create New List
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Lists */}
          {shoppingLists.length === 0 ? (
            <View style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 16,
              padding: 40,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.1)',
            }}>
              <Ionicons name="list-outline" size={64} color="#64748B" />
              <Text style={{
                color: '#E2E8F0',
                fontSize: 20,
                fontWeight: '600',
                marginTop: 16,
                marginBottom: 8,
              }}>
                No Lists Yet
              </Text>
              <Text style={{
                color: '#94A3B8',
                fontSize: 14,
                textAlign: 'center',
                maxWidth: 300,
              }}>
                Create your first shopping list to start organizing your purchases
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {shoppingLists.map((list) => (
                <TouchableOpacity
                  key={list.id}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(148, 163, 184, 0.1)',
                    padding: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#FFFFFF',
                      marginBottom: 4,
                    }}>
                      {list.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                        {list.itemCount} items
                      </Text>
                      <Text style={{ fontSize: 12, color: '#64748B' }}>
                        • {list.lastUpdated}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
