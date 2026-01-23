/**
 * Analytics Tab Screen
 * Developer/Admin analytics dashboard
 */

import { ScrollView, View, Text, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '@/components/AppHeader';

export default function AnalyticsScreen() {
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
              colors={['rgba(16, 185, 129, 0.2)', 'rgba(6, 182, 212, 0.2)']}
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
                colors={['#10B981', '#06B6D4']}
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
                <Ionicons name="bar-chart" size={32} color="#ffffff" />
              </LinearGradient>
              
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>
                  Analytics Dashboard
                </Text>
                <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                  Track app performance and user metrics
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Users', value: '12,543', icon: 'people' },
              { label: 'Active Today', value: '3,421', icon: 'pulse' },
              { label: 'Searches', value: '45,892', icon: 'search' },
              { label: 'Savings', value: '$1.2M', icon: 'cash' },
            ].map((stat, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(148, 163, 184, 0.1)',
                  padding: 20,
                  width: '47%',
                  alignItems: 'center',
                }}
              >
                <Ionicons name={stat.icon as any} size={32} color="#10B981" style={{ marginBottom: 8 }} />
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>
                  {stat.value}
                </Text>
                <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center' }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Popular Categories */}
          <View style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.1)',
            padding: 24,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#E2E8F0', marginBottom: 16 }}>
              Popular Categories
            </Text>
            
            {[
              { name: 'Groceries', searches: '12,543', growth: '+15%' },
              { name: 'Electronics', searches: '8,921', growth: '+23%' },
              { name: 'Clothing', searches: '6,432', growth: '+8%' },
              { name: 'Home Decor', searches: '4,123', growth: '+12%' },
            ].map((category, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: index < 3 ? 1 : 0,
                  borderBottomColor: 'rgba(148, 163, 184, 0.1)',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                    {category.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                    {category.searches} searches
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#10B981' }}>
                  {category.growth}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}













