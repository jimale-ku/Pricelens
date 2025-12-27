/**
 * Top App Header
 * Copilot TODO:
 * - Match exact gradient from Figma
 * - Replace emoji with SVG icon
 */

import { View, Text, Pressable } from "react-native";

export default function Navbar() {
  return (
    <View className="flex-row items-center justify-between px-6 py-4 border-b border-white/10">
      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 items-center justify-center">
          <Text className="text-white font-bold">👁</Text>
        </View>

        <View>
          <Text className="text-white font-semibold">PriceLens</Text>
          <Text className="text-xs text-gray-400">
            Smart Savings Companion
          </Text>
        </View>
      </View>

      <Pressable className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
        <Text className="text-white text-sm">Sign Out</Text>
      </Pressable>
    </View>
  );
}
