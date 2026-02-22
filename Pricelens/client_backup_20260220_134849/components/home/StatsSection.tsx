/**
 * Stats Section Component
 * Shows: 39 Categories, 100+ Retailers, Real-Time Updates, Smart AI
 */

import { View, Text } from 'react-native';

export default function StatsSection() {
  const stats = [
    { value: '39', label: 'Categories', color: '#3B82F6' },
    { value: '100+', label: 'Retailers', color: '#8B5CF6' },
    { value: 'Real-Time', label: 'Price Updates', color: '#06B6D4' },
    { value: 'Smart', label: 'AI Recommendations', color: '#EC4899' },
  ];

  return (
    <View className="mx-4 mt-10 mb-8 p-8 bg-white/5 border border-white/10 rounded-2xl">
      <View className="flex-row justify-between">
        {stats.map((stat, index) => (
          <View key={index} className="items-center flex-1">
            <Text className="text-3xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </Text>
            <View
              className="h-1 w-16 rounded-full mt-2"
              style={{ backgroundColor: stat.color }}
            />
            <Text className="text-gray-400 text-sm mt-2 text-center">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
