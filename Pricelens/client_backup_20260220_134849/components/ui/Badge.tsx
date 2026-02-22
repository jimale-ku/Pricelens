/**
 * Reusable Badge Component
 */

import { View, Text } from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

export default function Badge({ children, variant = 'primary', size = 'sm' }: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-purple-600';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1';
      case 'md':
        return 'px-3 py-1.5';
      default:
        return 'px-2 py-1';
    }
  };

  const getTextSize = () => (size === 'sm' ? 'text-xs' : 'text-sm');

  return (
    <View className={`rounded-full ${getVariantStyles()} ${getSizeStyles()}`}>
      <Text className={`text-white font-medium ${getTextSize()}`}>{children}</Text>
    </View>
  );
}
