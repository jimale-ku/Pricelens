/**
 * PriceLens Plus Tab Screen
 * Subscription features and benefits
 */

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '@/components/AppHeader';

export default function PlusScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <AppHeader />
        
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          {/* Hero Section */}
          <View style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.1)',
            padding: 32,
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.2)', 'rgba(236, 72, 153, 0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12, position: 'relative', zIndex: 10 }}>
              <LinearGradient
                colors={['#A855F7', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="trophy" size={32} color="#ffffff" />
              </LinearGradient>
              
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>
                  PriceLens Plus
                </Text>
                <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                  Unlock premium features and save more
                </Text>
              </View>
            </View>
          </View>

          {/* Features */}
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#E2E8F0', marginBottom: 8 }}>
              Premium Features
            </Text>
            
            {[
              { icon: 'receipt', title: 'AI Receipt Scanner', desc: 'Scan receipts to track purchases automatically' },
              { icon: 'barcode', title: 'In-Store Price Scanner', desc: 'Scan barcodes to compare prices instantly' },
              { icon: 'ticket', title: 'Coupon Finder', desc: 'Automatically find and apply coupons' },
              { icon: 'book', title: 'Smart Shopping Guides', desc: 'Get personalized shopping recommendations' },
            ].map((feature, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(148, 163, 184, 0.1)',
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: 'rgba(168, 85, 247, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons name={feature.icon as any} size={24} color="#A855F7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>
                    {feature.title}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                    {feature.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing */}
          <View style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(168, 85, 247, 0.3)',
            padding: 24,
            marginTop: 24,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 8 }}>
              $4.99/month
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={{ marginTop: 16, width: '100%' }}
            >
              <LinearGradient
                colors={['#A855F7', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  Subscribe to Plus
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

