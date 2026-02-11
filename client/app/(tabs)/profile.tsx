/**
 * Profile Tab Screen
 * User info section (photo, name, email, zip, phone) with Edit top-right; subscription, shortcuts, logout.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AppHeader from '@/components/AppHeader';
import {
  getProfile,
  saveProfile,
  saveAvatarFromUri,
  type ProfileData,
} from '@/utils/profileService';

const sectionStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(148, 163, 184, 0.1)',
};
const labelStyle = { fontSize: 12, color: '#94A3B8', marginBottom: 4 };
const inputStyle = {
  fontSize: 16,
  color: '#FFFFFF',
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 10,
  backgroundColor: 'rgba(30, 41, 59, 0.6)',
  borderWidth: 1,
  borderColor: 'rgba(148, 163, 184, 0.2)',
};

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<ProfileData>({
    name: '',
    email: '',
    zipCode: '',
    phone: '',
    avatarUri: null,
  });
  const [saving, setSaving] = useState(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const data = await getProfile();
    setProfile(data);
    setEditDraft(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleStartEdit = () => {
    setEditDraft(profile ?? editDraft);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditDraft(profile ?? editDraft);
    setPendingImageUri(null);
    setIsEditing(false);
  };

  const handleConfirmImageUpload = async () => {
    if (!pendingImageUri) return;
    
    setPickingPhoto(true);
    try {
      const persistentUri = await saveAvatarFromUri(pendingImageUri);
      console.log('💾 Saving avatar URI:', persistentUri);
      setEditDraft((prev) => ({ ...prev, avatarUri: persistentUri }));
      setPendingImageUri(null);
    } catch (error: any) {
      console.error('❌ Error uploading image:', error);
      Alert.alert('Error', `Could not upload image: ${error?.message || 'Unknown error'}`);
    } finally {
      setPickingPhoto(false);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    // If there's a pending image, confirm it first
    if (pendingImageUri) {
      await handleConfirmImageUpload();
    }
    await saveProfile(editDraft);
    setProfile(editDraft);
    setPendingImageUri(null);
    setIsEditing(false);
    setSaving(false);
  };

  const pickProfilePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Allow access to your photos to set a profile picture.'
        );
        return;
      }
      setPickingPhoto(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      
      if (result.canceled) {
        console.log('User canceled image picker');
        setPickingPhoto(false);
        return;
      }
      
      if (!result.assets || !result.assets[0] || !result.assets[0].uri) {
        console.warn('No image selected');
        setPickingPhoto(false);
        return;
      }
      
      const selectedUri = result.assets[0].uri;
      console.log('📸 Selected image URI:', selectedUri);
      
      // Store temporarily - user will confirm with "Upload" button
      setPendingImageUri(selectedUri);
    } catch (e: any) {
      console.error('❌ Error picking photo:', e);
      Alert.alert('Error', `Could not set photo: ${e?.message || 'Unknown error'}. Please try again.`);
    } finally {
      setPickingPhoto(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]
    );
  };

  const handleUpgrade = () => router.push('/(tabs)/plus');

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  const displayData = isEditing ? editDraft : (profile ?? editDraft);
  const hasAvatar = !!displayData.avatarUri;
  // Show pending image if available, otherwise show saved avatar
  const avatarToShow = pendingImageUri || displayData.avatarUri;
  const showingPendingImage = !!pendingImageUri;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <AppHeader />

          <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
            {/* User info section: photo, name, email, zip, phone — Edit top-right */}
            <View style={{ ...sectionStyle, padding: 24, marginBottom: 24, position: 'relative' }}>
              {!isEditing ? (
                <TouchableOpacity
                  onPress={handleStartEdit}
                  activeOpacity={0.7}
                  style={{ position: 'absolute', top: 20, right: 20, zIndex: 2 }}
                >
                  <Text style={{ fontSize: 14, color: '#3B82F6', fontWeight: '600' }}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 12, zIndex: 2 }}>
                  <TouchableOpacity onPress={handleCancelEdit} activeOpacity={0.7}>
                    <Text style={{ fontSize: 14, color: '#94A3B8' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveEdit}
                    disabled={saving}
                    activeOpacity={0.7}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#3B82F6" />
                    ) : (
                      <Text style={{ fontSize: 14, color: '#3B82F6', fontWeight: '600' }}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <TouchableOpacity
                  onPress={isEditing ? () => {
                    console.log('📸 Avatar tapped - opening image picker');
                    pickProfilePhoto();
                  } : undefined}
                  disabled={isEditing && pickingPhoto}
                  activeOpacity={isEditing ? 0.8 : 1}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    backgroundColor: avatarToShow ? 'transparent' : 'rgba(59, 130, 246, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderWidth: isEditing ? 2 : 0,
                    borderColor: isEditing ? '#3B82F6' : 'transparent',
                  }}
                >
                  {pickingPhoto ? (
                    <ActivityIndicator size="large" color="#3B82F6" />
                  ) : avatarToShow ? (
                    <Image
                      source={{ uri: avatarToShow }}
                      style={{ width: 96, height: 96, borderRadius: 48 }}
                      resizeMode="cover"
                      onError={(e) => {
                        console.error('❌ Image load error:', e.nativeEvent.error);
                        console.error('Failed URI:', avatarToShow);
                      }}
                      onLoad={() => {
                        console.log('✅ Image loaded successfully:', avatarToShow);
                      }}
                    />
                  ) : (
                    <Ionicons name="person" size={48} color="#3B82F6" />
                  )}
                  {isEditing && !pickingPhoto && !showingPendingImage && (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        paddingVertical: 4,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 11, color: '#FFF', fontWeight: '600' }}>Tap to change</Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                {/* Upload button - appears when image is selected but not yet confirmed */}
                {isEditing && showingPendingImage && !pickingPhoto && (
                  <TouchableOpacity
                    onPress={handleConfirmImageUpload}
                    disabled={pickingPhoto}
                    activeOpacity={0.8}
                    style={{
                      marginTop: 12,
                      backgroundColor: '#3B82F6',
                      paddingHorizontal: 24,
                      paddingVertical: 10,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {pickingPhoto ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                        <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '600' }}>Upload Image</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Name */}
              <View style={{ marginBottom: 16 }}>
                <Text style={labelStyle}>Name</Text>
                {isEditing ? (
                  <TextInput
                    style={inputStyle}
                    value={editDraft.name}
                    onChangeText={(t) => setEditDraft((p) => ({ ...p, name: t }))}
                    placeholder="Your name"
                    placeholderTextColor="#64748B"
                    autoCapitalize="words"
                  />
                ) : (
                  <Text style={{ fontSize: 16, color: '#FFFFFF' }}>
                    {displayData.name || '—'}
                  </Text>
                )}
              </View>

              {/* Email */}
              <View style={{ marginBottom: 16 }}>
                <Text style={labelStyle}>Email</Text>
                {isEditing ? (
                  <TextInput
                    style={inputStyle}
                    value={editDraft.email}
                    onChangeText={(t) => setEditDraft((p) => ({ ...p, email: t }))}
                    placeholder="email@example.com"
                    placeholderTextColor="#64748B"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <Text style={{ fontSize: 16, color: '#FFFFFF' }}>
                    {displayData.email || '—'}
                  </Text>
                )}
              </View>

              {/* Zip code */}
              <View style={{ marginBottom: 16 }}>
                <Text style={labelStyle}>ZIP code</Text>
                {isEditing ? (
                  <TextInput
                    style={inputStyle}
                    value={editDraft.zipCode}
                    onChangeText={(t) => setEditDraft((p) => ({ ...p, zipCode: t }))}
                    placeholder="e.g. 90210"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    maxLength={10}
                  />
                ) : (
                  <Text style={{ fontSize: 16, color: '#FFFFFF' }}>
                    {displayData.zipCode || '—'}
                  </Text>
                )}
              </View>

              {/* Phone */}
              <View style={{ marginBottom: 0 }}>
                <Text style={labelStyle}>Phone</Text>
                {isEditing ? (
                  <TextInput
                    style={inputStyle}
                    value={editDraft.phone}
                    onChangeText={(t) => setEditDraft((p) => ({ ...p, phone: t }))}
                    placeholder="(555) 123-4567"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={{ fontSize: 16, color: '#FFFFFF' }}>
                    {displayData.phone || '—'}
                  </Text>
                )}
              </View>
            </View>

            {/* Subscription / Tier */}
            <View style={{ ...sectionStyle, padding: 20, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: 'rgba(168, 85, 247, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons name="diamond-outline" size={22} color="#A855F7" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 }}>
                      Subscription
                    </Text>
                    <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                      Current plan: Free
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>
                Upgrade to Basic, Premium, or Pro for more features. Billing is handled securely via Stripe.
              </Text>
              <TouchableOpacity onPress={handleUpgrade} activeOpacity={0.8} style={{ width: '100%' }}>
                <LinearGradient
                  colors={['#A855F7', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                >
                  <Ionicons name="trophy" size={20} color="#FFFFFF" />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                    View plans & upgrade
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Premium Features Quick Access */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#94A3B8', marginBottom: 12, paddingHorizontal: 4 }}>
                Premium Features
              </Text>
              <View style={{ gap: 12 }}>
                {/* Price Alerts */}
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/alerts')}
                  activeOpacity={0.7}
                  style={{
                    ...sectionStyle,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons name="notifications-outline" size={20} color="#3B82F6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 }}>
                      Price Drop Alerts
                    </Text>
                    <Text style={{ fontSize: 12, color: '#94A3B8' }}>
                      Get notified when prices drop
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* Barcode Scanner */}
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/barcode-scanner')}
                  activeOpacity={0.7}
                  style={{
                    ...sectionStyle,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: 'rgba(6, 182, 212, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons name="barcode-outline" size={20} color="#06B6D4" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 }}>
                      Barcode Scanner
                    </Text>
                    <Text style={{ fontSize: 12, color: '#94A3B8' }}>
                      Scan barcodes to compare prices
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* AI Receipt Scanner */}
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/plus')}
                  activeOpacity={0.7}
                  style={{
                    ...sectionStyle,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons name="receipt-outline" size={20} color="#22C55E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 }}>
                      AI Receipt Scanner
                    </Text>
                    <Text style={{ fontSize: 12, color: '#94A3B8' }}>
                      Upload receipts for AI analysis
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* Camera Product Scanner - Coming Soon */}
                <View
                  style={{
                    ...sectionStyle,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    opacity: 0.6,
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: 'rgba(20, 184, 166, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons name="camera-outline" size={20} color="#14B8A6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#94A3B8' }}>
                        Camera Product Scanner
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
                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                      Take photos to find prices
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Favorites */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/favorites')}
              activeOpacity={0.7}
              style={{
                ...sectionStyle,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                marginBottom: 12,
              }}
            >
              <Ionicons name="heart-outline" size={24} color="#94A3B8" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>
                  Favorites
                </Text>
                <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                  View your saved favorite products
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            {/* Settings Options */}
            <View style={{ gap: 12, marginBottom: 24 }}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/settings')}
                activeOpacity={0.7}
                style={{
                  ...sectionStyle,
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <Ionicons name="settings-outline" size={24} color="#94A3B8" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>
                    App Settings
                  </Text>
                  <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                    Notifications, location, preferences
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(tabs)/plus')}
                activeOpacity={0.7}
                style={{
                  ...sectionStyle,
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <Ionicons name="card-outline" size={24} color="#94A3B8" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>
                    Payment Methods
                  </Text>
                  <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                    Manage subscription and billing
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Logout */}
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.8}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.3)',
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#EF4444' }}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
