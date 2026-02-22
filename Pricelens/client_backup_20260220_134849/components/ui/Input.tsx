/**
 * Reusable Input Component
 */

import { View, TextInput, TextInputProps, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
}

export default function Input({ label, icon, error, ...props }: InputProps) {
  return (
    <View className="gap-2">
      {label && <Text className="text-white font-medium">{label}</Text>}
      
      <View className="flex-row items-center bg-white/5 border border-white/10 rounded-xl px-4">
        {icon && (
          <Ionicons name={icon} size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
        )}
        <TextInput
          className="flex-1 py-3 text-white"
          placeholderTextColor="#9CA3AF"
          {...props}
        />
      </View>
      
      {error && <Text className="text-red-500 text-sm">{error}</Text>}
    </View>
  );
}
