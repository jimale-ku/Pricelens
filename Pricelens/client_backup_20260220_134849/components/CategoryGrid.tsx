/**
 * Grid of Categories - All 39 Categories
 */

import { View, Text } from "react-native";
import CategoryCard from "./CategoryCard";
import { CATEGORY_LIST } from "@/constants/categories";

export default function CategoryGrid() {
  return (
    <View className="mt-10 px-4 mb-8">
      <View className="mb-6">
        <Text className="text-white text-2xl font-bold">Browse by Category</Text>
        <Text className="text-gray-400 mt-1">
          Explore our {CATEGORY_LIST.length} comparison categories
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-4">
        {CATEGORY_LIST.map((category) => (
          <View key={category.id} className="w-[48%]">
            <CategoryCard category={category} />
          </View>
        ))}
      </View>
    </View>
  );
}
