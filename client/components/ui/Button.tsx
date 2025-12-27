/**
 * Reusable Button Component
 */

import { Pressable, Text, ActivityIndicator, PressableProps } from 'react-native';
import { theme } from '@/constants/theme';

interface ButtonProps extends PressableProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-purple-600 active:bg-purple-700';
      case 'secondary':
        return 'bg-cyan-500 active:bg-cyan-600';
      case 'outline':
        return 'bg-transparent border border-white/10 active:bg-white/5';
      case 'ghost':
        return 'bg-white/5 active:bg-white/10';
      default:
        return 'bg-purple-600 active:bg-purple-700';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 rounded-lg';
      case 'md':
        return 'px-4 py-3 rounded-xl';
      case 'lg':
        return 'px-6 py-4 rounded-xl';
      default:
        return 'px-4 py-3 rounded-xl';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <Pressable
      className={`items-center justify-center ${getVariantStyles()} ${getSizeStyles()} ${
        disabled || loading ? 'opacity-50' : ''
      }`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className={`text-white font-medium ${getTextSize()}`}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
