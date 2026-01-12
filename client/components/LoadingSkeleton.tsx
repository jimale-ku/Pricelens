/**
 * Loading Skeleton - Shows immediately while page content loads
 */

import { View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoadingSkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0B1020', paddingHorizontal: 16, paddingVertical: 24 }}>
      {/* Header Skeleton */}
      <View style={{
        backgroundColor: 'rgba(21, 27, 40, 0.6)',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(139, 149, 168, 0.15)',
        marginBottom: 24,
        height: 120,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{
              height: 24,
              width: '70%',
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }} />
            <View style={{
              height: 16,
              width: '90%',
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }} />
          </View>
        </View>
      </View>

      {/* Search Skeleton */}
      <View style={{
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        height: 80,
      }}>
        <View style={{
          height: 36,
          borderRadius: 6,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        }} />
      </View>

      {/* Loading Indicator */}
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    </View>
  );
}

