/**
 * Reusable Checkbox Component
 */

import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled = false,
}: CheckboxProps) {
  return (
    <Pressable
      className={`flex-row items-center gap-2 ${disabled ? 'opacity-50' : ''}`}
      onPress={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
    >
      <View
        className={`w-5 h-5 rounded items-center justify-center ${
          checked ? 'bg-cyan-500' : 'bg-white/5 border border-white/10'
        }`}
      >
        {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
      {label && <Text className="text-white text-sm">{label}</Text>}
    </Pressable>
  );
}
