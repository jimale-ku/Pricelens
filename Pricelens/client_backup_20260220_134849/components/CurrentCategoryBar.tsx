/**
 * Bar shown directly below the header on category pages so the user
 * always sees which category they're viewing (e.g. "Rental Cars").
 */

import { View, Text } from 'react-native';

type Props = { categoryName: string };

export default function CurrentCategoryBar({ categoryName }: Props) {
  if (!categoryName?.trim()) return null;
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(15,23,42,0.9)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(148,163,184,0.2)',
      }}
    >
      <Text
        style={{
          color: '#60A5FA',
          fontSize: 14,
          fontWeight: '600',
        }}
      >
        {categoryName}
      </Text>
    </View>
  );
}
