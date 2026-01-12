import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import CheckIcon from './icons/CheckIcon';

export default function StoreChip({ label, checked, onPress }) {
  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 16,
          height: 16,
          backgroundColor: checked ? '#4F8FF7' : 'transparent',
          borderRadius: 4,
          borderWidth: checked ? 0 : 1,
          borderColor: '#4F8FF7',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
        }}
      >
        {checked && <CheckIcon size={10} color="#fff" />}
      </View>
      <Text
        style={{
          color: '#E8EDF4',
          fontSize: 16,
          lineHeight: 24,
          fontFamily: 'System',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}