/**
 * Category Card Component
 */

import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Category } from "@/types";
import { Badge } from "./ui";

type Props = {
  category: Category;
};

export default function CategoryCard({ category }: Props) {
  const handlePress = () => {
    router.push(`/category/${category.slug}`);
  };

  return (
    <Pressable
      className="bg-white/5 border border-white/10 rounded-xl p-4 active:bg-white/10"
      onPress={handlePress}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View
          className="w-12 h-12 rounded-xl items-center justify-center"
          style={{ backgroundColor: category.iconColor }}
        >
          <Ionicons name={category.icon as any} size={24} color="#FFFFFF" />
        </View>
        {category.isNew && (
          <Badge variant="info" size="sm">NEW</Badge>
        )}
      </View>

      <Text className="text-white font-semibold text-base mb-1">
        {category.name}
      </Text>
      <Text className="text-gray-400 text-xs leading-relaxed">
        {category.description}
      </Text>
    </Pressable>
  );
}
