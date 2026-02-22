/**
 * Reusable Checkbox Component
 */

import { Pressable, Text, View, StyleSheet } from 'react-native';
import CheckIcon from '../icons/CheckIcon';

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
      onPress={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled]}
    >
      {/* Checkbox Button */}
      <View
        style={[
          styles.checkbox,
          checked && styles.checkboxChecked,
        ]}
      >
        {checked && (
          <View style={styles.iconContainer}>
            <CheckIcon width={14} height={14} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Label */}
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // var(--spacing) * 2
  },
  disabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 16, // calc(var(--spacing) * 4)
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6B7280',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    // Box shadow
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  checkboxChecked: {
    backgroundColor: 'rgb(79, 143, 247)', // var(--primary)
    borderColor: 'rgb(79, 143, 247)',
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14, // var(--text-sm)
    color: '#E8EDF4',
    fontWeight: '400',
  },
});

