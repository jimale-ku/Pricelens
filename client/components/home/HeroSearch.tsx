/**
 * Hero Universal Search Section
 */

import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TrendingPills from "./TrendingPills";

export default function HeroSearch() {
  return (
    <View className="mx-4 mt-8 p-6 rounded-2xl bg-white/5 border border-white/10">
      <View className="items-center gap-4">
        <View className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 items-center justify-center">
          <Ionicons name="search" size={28} color="#FFFFFF" />
        </View>

        <View className="items-center">
          <Text className="text-white text-2xl font-semibold">
            Universal <Text className="text-cyan-400">Search</Text>
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            Powered by AI • 100+ Retailers
          </Text>
        </View>

        <Text className="text-gray-400 text-center">
          Search ANY product across 100+ major retailers. Compare prices, find deals, and save money effortlessly.
        </Text>

        <View className="flex-row mt-4 gap-3 w-full">
          <View className="flex-1 flex-row items-center bg-white/5 border border-white/10 rounded-xl px-4">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search for iPhone, LEGO, running shoes, coffee maker..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3 py-3 text-white"
            />
          </View>

          <Pressable className="px-6 rounded-xl bg-cyan-500 justify-center active:bg-cyan-600">
            <Text className="text-white font-medium">Search</Text>
          </Pressable>
        </View>

        <View className="w-full mt-2">
          <Text className="text-gray-400 text-sm mb-2 ml-1">Trending:</Text>
          <TrendingPills />
        </View>
      </View>
    </View>
  );
}
