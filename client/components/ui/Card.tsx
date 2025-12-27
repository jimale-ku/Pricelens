/**
 * Reusable Card Component
 */

import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'bordered' | 'highlighted';
}

export default function Card({ variant = 'default', children, className, ...props }: CardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'bordered':
        return 'bg-white/5 border border-white/10';
      case 'highlighted':
        return 'bg-white/5 border-2 border-cyan-500';
      default:
        return 'bg-white/5 border border-white/10';
    }
  };

  return (
    <View className={`rounded-xl ${getVariantStyles()} ${className || ''}`} {...props}>
      {children}
    </View>
  );
}
