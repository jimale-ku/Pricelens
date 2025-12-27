/**
 * Horizontal Category Navigation
 */

import { ScrollView, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CATEGORY_LIST } from "@/constants/categories";
import { router } from "expo-router";

export default function CategoryTabs() {
  const handleTabPress = (slug: string) => {
    if (slug === 'search') {
      router.push('/(tabs)/search');
    } else {
      router.push(`/category/${slug}`);
    }
  };

  const displayCategories = [
    { id: 'search', name: 'Search', slug: 'search', icon: 'search' },
    ...CATEGORY_LIST.slice(0, 8),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-6"
      contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
    >
      {displayCategories.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => handleTabPress(item.slug)}
          className={`px-4 py-2 rounded-lg flex-row items-center gap-2 ${
            item.id === 'search'
              ? 'bg-purple-600'
              : 'bg-white/5 border border-white/10'
          }`}
        >
          {item.icon && (
            <Ionicons
              name={item.icon as any}
              size={16}
              color="#FFFFFF"
            />
          )}
          <Text className="text-white text-sm">{item.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
