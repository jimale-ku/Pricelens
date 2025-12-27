/**
 * Trending Pills Component
 * Shows trending search items
 */

import { ScrollView, Pressable, Text } from 'react-native';
import { TRENDING_SEARCHES } from '@/constants/categories';

export default function TrendingPills() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-4"
      contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
    >
      {TRENDING_SEARCHES.map((item, index) => (
        <Pressable
          key={index}
          className="px-4 py-2 rounded-full bg-white/10 border border-white/20"
        >
          <Text className="text-gray-300 text-sm">{item}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
