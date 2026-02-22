/**
 * Settings Screen
 * Manage app preferences: notifications, location, default stores, payment methods
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '@/components/AppHeader';
import { authenticatedFetch, getAccessToken } from '@/utils/auth';
import { API_ENDPOINTS } from '@/constants/api';

interface UserPreferences {
  defaultStores: string[];
  searchRadius: number;
  preferredZipCode: string | null;
  priceAlertEmail: boolean;
  trendingEmail: boolean;
}

const sectionStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(148, 163, 184, 0.1)',
};

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultStores: [],
    searchRadius: 10,
    preferredZipCode: null,
    priceAlertEmail: true,
    trendingEmail: false,
  });

  const loadPreferences = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      Alert.alert('Login Required', 'Please log in to manage settings.');
      router.replace('/(auth)/login');
      return;
    }

    setLoading(true);
    try {
      const res = await authenticatedFetch(`${API_ENDPOINTS.base}/user-preferences`);
      if (res.ok) {
        const data = await res.json();
        setPreferences({
          defaultStores: data.defaultStores || [],
          searchRadius: data.searchRadius ?? 10,
          preferredZipCode: data.preferredZipCode || null,
          priceAlertEmail: data.priceAlertEmail ?? true,
          trendingEmail: data.trendingEmail ?? false,
        });
      } else if (res.status === 401) {
        Alert.alert('Login Required', 'Please log in to manage settings.');
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const savePreferences = async () => {
    setSaving(true);
    try {
      const res = await authenticatedFetch(`${API_ENDPOINTS.base}/user-preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (res.ok) {
        Alert.alert('Success', 'Settings saved successfully!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        Alert.alert('Error', errorData?.message || 'Failed to save settings.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <AppHeader />

        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          {/* Location Settings */}
          <View style={{ ...sectionStyle, padding: 20, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="location-outline" size={22} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 }}>
                  Location Settings
                </Text>
                <Text style={{ fontSize: 13, color: '#94A3B8' }}>
                  Set your default location and search radius
                </Text>
              </View>
            </View>

            {/* Preferred ZIP Code */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: '#94A3B8', marginBottom: 8 }}>Preferred ZIP Code</Text>
              <TextInput
                value={preferences.preferredZipCode || ''}
                onChangeText={(text) => setPreferences((p) => ({ ...p, preferredZipCode: text || null }))}
                placeholder="e.g. 90210"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                maxLength={10}
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  borderRadius: 10,
                  padding: 14,
                  color: '#FFFFFF',
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(148, 163, 184, 0.2)',
                }}
              />
            </View>

            {/* Search Radius */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: '#94A3B8' }}>Search Radius</Text>
                <Text style={{ fontSize: 14, color: '#3B82F6', fontWeight: '600' }}>
                  {preferences.searchRadius} miles
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[5, 10, 15, 25, 50].map((radius) => (
                  <TouchableOpacity
                    key={radius}
                    onPress={() => setPreferences((p) => ({ ...p, searchRadius: radius }))}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: preferences.searchRadius === radius
                        ? '#3B82F6'
                        : 'rgba(30, 41, 59, 0.8)',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: preferences.searchRadius === radius
                        ? '#3B82F6'
                        : 'rgba(148, 163, 184, 0.2)',
                    }}
                  >
                    <Text style={{
                      color: preferences.searchRadius === radius ? '#FFFFFF' : '#94A3B8',
                      fontSize: 13,
                      fontWeight: preferences.searchRadius === radius ? '600' : '400',
                    }}>
                      {radius}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Notification Settings */}
          <View style={{ ...sectionStyle, padding: 20, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="notifications-outline" size={22} color="#A855F7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 }}>
                  Notifications
                </Text>
                <Text style={{ fontSize: 13, color: '#94A3B8' }}>
                  Manage your notification preferences
                </Text>
              </View>
            </View>

            {/* Price Alert Emails */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(148, 163, 184, 0.1)',
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>
                  Price Drop Alerts
                </Text>
                <Text style={{ fontSize: 13, color: '#94A3B8' }}>
                  Email notifications when prices drop
                </Text>
              </View>
              <Switch
                value={preferences.priceAlertEmail}
                onValueChange={(value) => setPreferences((p) => ({ ...p, priceAlertEmail: value }))}
                trackColor={{ false: '#374151', true: '#A855F7' }}
                thumbColor={preferences.priceAlertEmail ? '#FFFFFF' : '#94A3B8'}
              />
            </View>

            {/* Trending Products Emails */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 12,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>
                  Trending Products
                </Text>
                <Text style={{ fontSize: 13, color: '#94A3B8' }}>
                  Weekly email with trending deals
                </Text>
              </View>
              <Switch
                value={preferences.trendingEmail}
                onValueChange={(value) => setPreferences((p) => ({ ...p, trendingEmail: value }))}
                trackColor={{ false: '#374151', true: '#A855F7' }}
                thumbColor={preferences.trendingEmail ? '#FFFFFF' : '#94A3B8'}
              />
            </View>
          </View>

          {/* Default Stores (Coming Soon) */}
          <View style={{ ...sectionStyle, padding: 20, marginBottom: 24, opacity: 0.6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="storefront-outline" size={22} color="#06B6D4" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#94A3B8', marginBottom: 2 }}>
                    Default Stores
                  </Text>
                  <View style={{
                    backgroundColor: 'rgba(148, 163, 184, 0.2)',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                  }}>
                    <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '600' }}>COMING SOON</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: '#64748B' }}>
                  Set your favorite stores for quick filtering
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Methods */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/plus')}
            activeOpacity={0.7}
            style={{ ...sectionStyle, padding: 20, marginBottom: 24 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="card-outline" size={22} color="#22C55E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 }}>
                  Payment Methods
                </Text>
                <Text style={{ fontSize: 13, color: '#94A3B8' }}>
                  Manage subscription and payment options
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          {/* Save Button */}
          <TouchableOpacity
            onPress={savePreferences}
            disabled={saving}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#3B82F6',
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                  Save Settings
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
