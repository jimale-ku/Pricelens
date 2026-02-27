/**
 * Barcode Scanner Screen
 * Scan or manually enter barcode to compare prices
 */

import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AppHeader from '@/components/AppHeader';
import { API_ENDPOINTS } from '@/constants/api';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/hooks/useSubscription';

const { width, height } = Dimensions.get('window');

export default function BarcodeScannerScreen() {
  const router = useRouter();
  const { isPremium, loading: subLoading } = useSubscription();
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleSearch = async () => {
    if (!barcode.trim()) {
      Alert.alert('Error', 'Please enter or scan a barcode.');
      return;
    }

    // Validate barcode format (8-14 digits)
    const cleanBarcode = barcode.trim().replace(/\D/g, '');
    if (cleanBarcode.length < 8 || cleanBarcode.length > 14) {
      Alert.alert('Error', 'Barcode must be 8-14 digits.');
      return;
    }

    setLoading(true);
    try {
      // Use compare API with GTIN search type
      const url = API_ENDPOINTS.products.compareMultiStore(cleanBarcode, 'gtin');
      const res = await fetch(url, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        // The compare API returns product data with name, category, etc.
        if (data && data.name) {
          // Generate product slug from name
          const productSlug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          
          // Get category slug (default to 'products' if not available)
          const categorySlug = data.categorySlug || data.category?.slug || 'products';
          const productId = data.productId || data.id;
          
          // Navigate to product comparison page with proper route structure
          const params = new URLSearchParams();
          if (productId) params.append('productId', productId.toString());
          if (data.name) params.append('productName', data.name);
          
          router.push(`/category/${categorySlug}/${productSlug}/compare?${params.toString()}`);
        } else {
          Alert.alert('Not Found', 'No product found for this barcode. Try searching by name instead.');
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        Alert.alert('Error', errorData?.message || 'Failed to find product. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanPress = async () => {
    if (!permission) {
      // Permission is still loading
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission',
          'Camera access is required to scan barcodes. Please enable it in your device settings.'
        );
        return;
      }
    }

    setShowCamera(true);
    setScanning(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (data && data.trim() && scanning) {
      setBarcode(data.trim());
      setShowCamera(false);
      setScanning(false);
      // Auto-search after scanning
      setTimeout(() => {
        handleSearch();
      }, 300);
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    setScanning(false);
  };

  if (subLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </SafeAreaView>
    );
  }

  if (!isPremium) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <AppHeader />
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(6, 182, 212, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Ionicons name="lock-closed" size={36} color="#06B6D4" />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' }}>PriceLens Plus Required</Text>
            <Text style={{ fontSize: 15, color: '#94A3B8', textAlign: 'center', marginBottom: 28 }}>Barcode Scanner is a premium feature. Upgrade to scan and compare prices across stores.</Text>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/plus')}
              activeOpacity={0.85}
              style={{ backgroundColor: '#06B6D4', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Upgrade to Plus</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <AppHeader />
      <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 24 }}>
        {/* Header */}
        <View style={{ marginBottom: 32, alignItems: 'center' }}>
          <LinearGradient
            colors={['#06B6D4', '#0891B2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name="barcode" size={40} color="#FFFFFF" />
          </LinearGradient>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>
            Barcode Scanner
          </Text>
          <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', maxWidth: 280 }}>
            Scan or enter a barcode to compare prices across all stores
          </Text>
        </View>

        {/* Manual Entry */}
        <View
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: 'rgba(6, 182, 212, 0.3)',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
            Enter Barcode Manually
          </Text>
          <TextInput
            value={barcode}
            onChangeText={setBarcode}
            placeholder="Enter 8-14 digit barcode (GTIN/UPC/EAN)"
            placeholderTextColor="#64748B"
            keyboardType="number-pad"
            maxLength={14}
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              borderRadius: 10,
              padding: 16,
              color: '#FFFFFF',
              fontSize: 18,
              fontFamily: 'monospace',
              letterSpacing: 2,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(6, 182, 212, 0.3)',
            }}
          />
          <TouchableOpacity
            onPress={handleSearch}
            disabled={loading || !barcode.trim()}
            style={{ width: '100%' }}
          >
            <LinearGradient
              colors={['#06B6D4', '#0891B2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                borderRadius: 10,
                alignItems: 'center',
                opacity: loading || !barcode.trim() ? 0.5 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="search" size={20} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Compare Prices</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Camera Scanner */}
        <View
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: 'rgba(6, 182, 212, 0.3)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Ionicons name="camera" size={24} color="#06B6D4" />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>Camera Scanner</Text>
          </View>
          <Text style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>
            Point your camera at a barcode to scan automatically
          </Text>
          <TouchableOpacity
            onPress={handleScanPress}
            disabled={scanning}
            style={{
              backgroundColor: '#06B6D4',
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Scan with Camera</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Camera Modal */}
        <Modal
          visible={showCamera}
          animationType="slide"
          onRequestClose={handleCloseCamera}
        >
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: [
                  'ean13',
                  'ean8',
                  'upc_a',
                  'upc_e',
                  'code128',
                  'code39',
                  'code93',
                  'codabar',
                  'itf14',
                  'datamatrix',
                  'qr',
                ],
              }}
              onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
            >
              <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}>
                  <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '600' }}>Scan Barcode</Text>
                  <TouchableOpacity onPress={handleCloseCamera}>
                    <Ionicons name="close" size={28} color="#FFF" />
                  </TouchableOpacity>
                </View>

                {/* Scanning Area Indicator */}
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{
                    width: width * 0.8,
                    height: width * 0.4,
                    borderWidth: 2,
                    borderColor: '#06B6D4',
                    borderRadius: 12,
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  }}>
                    <View style={{
                      position: 'absolute',
                      top: -2,
                      left: -2,
                      width: 20,
                      height: 20,
                      borderTopWidth: 3,
                      borderLeftWidth: 3,
                      borderColor: '#06B6D4',
                    }} />
                    <View style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 20,
                      height: 20,
                      borderTopWidth: 3,
                      borderRightWidth: 3,
                      borderColor: '#06B6D4',
                    }} />
                    <View style={{
                      position: 'absolute',
                      bottom: -2,
                      left: -2,
                      width: 20,
                      height: 20,
                      borderBottomWidth: 3,
                      borderLeftWidth: 3,
                      borderColor: '#06B6D4',
                    }} />
                    <View style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 20,
                      height: 20,
                      borderBottomWidth: 3,
                      borderRightWidth: 3,
                      borderColor: '#06B6D4',
                    }} />
                  </View>
                  <Text style={{
                    color: '#FFF',
                    fontSize: 14,
                    marginTop: 20,
                    textAlign: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}>
                    Position barcode within the frame
                  </Text>
                </View>

                {/* Footer */}
                <View style={{
                  padding: 24,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  alignItems: 'center',
                }}>
                  <TouchableOpacity
                    onPress={handleCloseCamera}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      paddingHorizontal: 32,
                      paddingVertical: 12,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </CameraView>
          </View>
        </Modal>

        {/* Info */}
        <View style={{ marginTop: 24, padding: 16, backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.2)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <Ionicons name="information-circle" size={20} color="#06B6D4" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#06B6D4', fontWeight: '600', marginBottom: 4 }}>
                How it works
              </Text>
              <Text style={{ fontSize: 12, color: '#94A3B8', lineHeight: 18 }}>
                Enter the barcode number (usually found below the product barcode) and we'll search for prices across all stores. Barcodes are typically 8-14 digits long.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
