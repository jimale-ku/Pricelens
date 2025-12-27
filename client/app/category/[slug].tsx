/**
 * Dynamic Category Page
 * Route: /category/[slug]
 */

import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams();

  return (
    <View className="flex-1 bg-[#0B1020] items-center justify-center">
      <Text className="text-white text-xl">Category: {slug}</Text>
      <Text className="text-gray-400 mt-2">Coming in Week 2</Text>
    </View>
  );
}
