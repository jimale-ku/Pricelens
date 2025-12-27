/**
 * Product Detail Page
 * Route: /product/[id]
 */

import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ProductScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View className="flex-1 bg-[#0B1020] items-center justify-center">
      <Text className="text-white text-xl">Product: {id}</Text>
      <Text className="text-gray-400 mt-2">Coming in Week 2</Text>
    </View>
  );
}
