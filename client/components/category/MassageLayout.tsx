/**
 * Massage Layout - Custom Form Matching Figma Design
 * 
 * Features:
 * - "Find Massage Parlors" form
 * - ZIP Code input with location pin icon
 * - Massage Type dropdown with heart icon
 * - Duration dropdown with clock icon
 * - Preferences (Optional) section with checkboxes
 * - Compare Prices button with gradient
 */

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, TextInput, Alert, Modal } from "react-native";
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from "@/components/AppHeader";
import CurrentCategoryBar from "@/components/CurrentCategoryBar";
import BottomNav from "@/components/BottomNav";
import CategoryAdCard from "@/components/CategoryAdCard";
import { getIconName } from '@/utils/iconMapper';

interface MassageLayoutProps {
  categorySlug: string;
  categoryName: string;
  categoryDescription: string;
  categoryIcon: string;
  iconGradient: string[];
}

interface Preference {
  id: string;
  label: string;
  hasIcon?: boolean;
  iconName?: string;
}

const PREFERENCES: Preference[] = [
  { id: 'lmtCertified', label: 'LMT Certified' },
  { id: 'privateRoom', label: 'Private Room', hasIcon: true, iconName: 'lock-closed-outline' },
  { id: 'hotStone', label: 'Hot Stone Available' },
  { id: 'aromatherapy', label: 'Aromatherapy' },
  { id: 'deepTissue', label: 'Deep Tissue Specialist' },
  { id: 'onlineBooking', label: 'Online Booking' },
  { id: 'sameDay', label: 'Same-Day Appointments' },
];

const MASSAGE_TYPES = [
  { value: 'swedish', label: 'Swedish Massage' },
  { value: 'deepTissue', label: 'Deep Tissue' },
  { value: 'hotStone', label: 'Hot Stone' },
  { value: 'sports', label: 'Sports Massage' },
  { value: 'prenatal', label: 'Prenatal Massage' },
  { value: 'thai', label: 'Thai Massage' },
  { value: 'shiatsu', label: 'Shiatsu' },
  { value: 'reflexology', label: 'Reflexology' },
];

const DURATIONS = [
  { value: '30', label: '30 minutes' },
  { value: '60', label: '60 minutes' },
  { value: '90', label: '90 minutes' },
  { value: '120', label: '120 minutes' },
];

export default function MassageLayout({
  categorySlug,
  categoryName,
  categoryDescription,
  categoryIcon,
  iconGradient,
}: MassageLayoutProps) {
  const [zipCode, setZipCode] = useState('');
  const [massageType, setMassageType] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [selectedPreferences, setSelectedPreferences] = useState<Set<string>>(new Set());
  const [showMassageTypePicker, setShowMassageTypePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  const iconName = getIconName(categoryIcon);

  const togglePreference = (preferenceId: string) => {
    const newSelected = new Set(selectedPreferences);
    if (newSelected.has(preferenceId)) {
      newSelected.delete(preferenceId);
    } else {
      newSelected.add(preferenceId);
    }
    setSelectedPreferences(newSelected);
  };

  const handleComparePrices = () => {
    if (!zipCode.trim()) {
      Alert.alert('Missing Information', 'Please enter a ZIP code.');
      return;
    }

    if (!massageType) {
      Alert.alert('Missing Information', 'Please select a massage type.');
      return;
    }

    if (!duration) {
      Alert.alert('Missing Information', 'Please select a duration.');
      return;
    }

    // Here you would typically call an API to search for massage parlors
    Alert.alert(
      'Compare Prices',
      `Comparing massage prices in ${zipCode}...\n\nThis would connect to your massage parlor search API.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <AppHeader />
      <CurrentCategoryBar categoryName={categoryName} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <View style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.1)',
            padding: 32,
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Gradient Overlay */}
            <LinearGradient
              colors={[`${iconGradient[0]}15`, `${iconGradient[1]}15`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              marginBottom: 12,
              position: 'relative',
              zIndex: 10,
            }}>
              {/* Category Icon */}
              <LinearGradient
                colors={iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={iconName as any} size={32} color="#ffffff" />
              </LinearGradient>

              {/* Category Title */}
              <View style={{ flex: 1 }}>
                <MaskedView
                  maskElement={
                    <Text style={{
                      fontSize: 24,
                      fontWeight: '700',
                      lineHeight: 32,
                    }}>
                      {categoryName}
                    </Text>
                  }
                >
                  <LinearGradient
                    colors={iconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={{
                      fontSize: 24,
                      fontWeight: '700',
                      lineHeight: 32,
                      opacity: 0,
                    }}>
                      {categoryName}
                    </Text>
                  </LinearGradient>
                </MaskedView>
              </View>
            </View>

            {/* Category Description */}
            <Text style={{
              fontSize: 14,
              color: '#94A3B8',
              lineHeight: 20,
              position: 'relative',
              zIndex: 10,
            }}>
              {categoryDescription}
            </Text>
          </View>

          {/* Find Massage Parlors Form */}
          <View style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.1)',
            padding: 24,
            marginBottom: 24,
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 24,
            }}>
              <Ionicons name="location-outline" size={20} color={iconGradient[0]} />
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#E2E8F0',
              }}>
                Find Massage Parlors
              </Text>
            </View>

            {/* ZIP Code */}
            <View style={{ marginBottom: 20 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}>
                <Ionicons name="location-outline" size={18} color={iconGradient[0]} />
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#E2E8F0',
                }}>
                  ZIP Code
                </Text>
              </View>
              <TextInput
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="Enter ZIP code"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(96, 165, 250, 0.3)',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: '#FFFFFF',
                  fontSize: 16,
                }}
              />
            </View>

            {/* Massage Type */}
            <View style={{ marginBottom: 20 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}>
                <Ionicons name="heart-outline" size={18} color={iconGradient[0]} />
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#E2E8F0',
                }}>
                  Massage Type
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowMassageTypePicker(true)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(96, 165, 250, 0.3)',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{
                  color: massageType ? '#FFFFFF' : '#64748B',
                  fontSize: 16,
                }}>
                  {massageType
                    ? MASSAGE_TYPES.find(opt => opt.value === massageType)?.label
                    : 'Select type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Duration */}
            <View style={{ marginBottom: 24 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}>
                <Ionicons name="time-outline" size={18} color={iconGradient[0]} />
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#E2E8F0',
                }}>
                  Duration
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDurationPicker(true)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(96, 165, 250, 0.3)',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{
                  color: duration ? '#FFFFFF' : '#64748B',
                  fontSize: 16,
                }}>
                  {duration
                    ? DURATIONS.find(opt => opt.value === duration)?.label
                    : 'Select duration'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Preferences (Optional) */}
            <View style={{ marginBottom: 24 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}>
                <Ionicons name="flash-outline" size={18} color={iconGradient[0]} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#E2E8F0',
                }}>
                  Preferences <Text style={{ color: '#64748B', fontWeight: '400' }}>(Optional)</Text>
                </Text>
              </View>

              <View style={{ gap: 12 }}>
                {PREFERENCES.map((preference) => (
                  <TouchableOpacity
                    key={preference.id}
                    onPress={() => togglePreference(preference.id)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: selectedPreferences.has(preference.id)
                        ? iconGradient[0]
                        : 'rgba(96, 165, 250, 0.3)',
                      backgroundColor: selectedPreferences.has(preference.id)
                        ? iconGradient[0]
                        : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {selectedPreferences.has(preference.id) && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Text style={{
                        color: '#E2E8F0',
                        fontSize: 14,
                      }}>
                        {preference.label}
                      </Text>
                      {preference.hasIcon && preference.iconName && (
                        <Ionicons name={preference.iconName as any} size={14} color="#94A3B8" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Compare Prices Button */}
            <TouchableOpacity
              onPress={handleComparePrices}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8B5CF6', '#06B6D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 12,
                  paddingVertical: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="flash" size={20} color="#FFFFFF" />
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  Compare Prices
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Sponsored ad at bottom – category-specific */}
          <CategoryAdCard categorySlug={categorySlug} />
        </View>
      </ScrollView>

      {/* Massage Type Picker Modal */}
      <Modal
        visible={showMassageTypePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMassageTypePicker(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: '#0F172A',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#E2E8F0',
              marginBottom: 20,
            }}>
              Massage Type
            </Text>
            {MASSAGE_TYPES.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  setMassageType(option.value);
                  setShowMassageTypePicker(false);
                }}
                style={{
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(148, 163, 184, 0.1)',
                }}
              >
                <Text style={{
                  color: '#E2E8F0',
                  fontSize: 16,
                }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowMassageTypePicker(false)}
              style={{
                marginTop: 16,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: '#94A3B8',
                fontSize: 16,
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Duration Picker Modal */}
      <Modal
        visible={showDurationPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDurationPicker(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: '#0F172A',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#E2E8F0',
              marginBottom: 20,
            }}>
              Duration
            </Text>
            {DURATIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  setDuration(option.value);
                  setShowDurationPicker(false);
                }}
                style={{
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(148, 163, 184, 0.1)',
                }}
              >
                <Text style={{
                  color: '#E2E8F0',
                  fontSize: 16,
                }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowDurationPicker(false)}
              style={{
                marginTop: 16,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: '#94A3B8',
                fontSize: 16,
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNav />
    </SafeAreaView>
  );
}
