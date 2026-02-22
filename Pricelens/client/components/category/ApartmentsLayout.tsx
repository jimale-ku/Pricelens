/**
 * Apartments Layout - Custom Form Matching Figma Design
 * 
 * Features:
 * - "Find Your Perfect Place" form with all fields from Figma
 * - Looking to Lease or Buy dropdown
 * - City input
 * - Neighborhood(s) optional input
 * - Unit Size dropdown
 * - Purchase Budget input
 * - Target Closing Date input with calendar icon
 * - Pets dropdown
 * - Must-Have Features checkboxes
 * - Search Apartments & Homes button
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
import { theme } from '@/constants/theme';
import { getIconName } from '@/utils/iconMapper';

interface ApartmentsLayoutProps {
  categorySlug: string;
  categoryName: string;
  categoryDescription: string;
  categoryIcon: string;
  iconGradient: string[];
}

interface Feature {
  id: string;
  label: string;
}

const FEATURES: Feature[] = [
  { id: 'pool', label: 'Pool' },
  { id: 'parking', label: 'Parking' },
  { id: 'airConditioning', label: 'Air Conditioning' },
  { id: 'balcony', label: 'Balcony/Patio' },
  { id: 'hardwood', label: 'Hardwood Floors' },
  { id: 'elevator', label: 'Elevator' },
  { id: 'gym', label: 'Gym/Fitness Center' },
  { id: 'laundry', label: 'In-Unit Laundry' },
  { id: 'dishwasher', label: 'Dishwasher' },
  { id: 'closets', label: 'Walk-In Closets' },
  { id: 'appliances', label: 'Stainless Steel Appliances' },
  { id: 'maintenance', label: '24-Hour Maintenance' },
];

export default function ApartmentsLayout({
  categorySlug,
  categoryName,
  categoryDescription,
  categoryIcon,
  iconGradient,
}: ApartmentsLayoutProps) {
  const [leaseOrBuy, setLeaseOrBuy] = useState<string>('');
  const [city, setCity] = useState('');
  const [neighborhoods, setNeighborhoods] = useState('');
  const [unitSize, setUnitSize] = useState<string>('');
  const [purchaseBudget, setPurchaseBudget] = useState('');
  const [targetClosingDate, setTargetClosingDate] = useState('');
  const [pets, setPets] = useState<string>('');
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [showLeaseOrBuyPicker, setShowLeaseOrBuyPicker] = useState(false);
  const [showUnitSizePicker, setShowUnitSizePicker] = useState(false);
  const [showPetsPicker, setShowPetsPicker] = useState(false);

  const iconName = getIconName(categoryIcon);

  const leaseOrBuyOptions = [
    { value: 'lease', label: 'Lease' },
    { value: 'buy', label: 'Buy' },
  ];

  const unitSizeOptions = [
    { value: 'studio', label: 'Studio' },
    { value: '1br', label: '1 Bedroom' },
    { value: '2br', label: '2 Bedroom' },
    { value: '3br', label: '3 Bedroom' },
    { value: '4br', label: '4+ Bedroom' },
  ];

  const petsOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'maybe', label: 'Maybe' },
  ];

  const toggleFeature = (featureId: string) => {
    const newSelected = new Set(selectedFeatures);
    if (newSelected.has(featureId)) {
      newSelected.delete(featureId);
    } else {
      newSelected.add(featureId);
    }
    setSelectedFeatures(newSelected);
  };


  const handleSearch = () => {
    if (!city.trim()) {
      Alert.alert('Missing Information', 'Please enter a city.');
      return;
    }

    // Here you would typically call an API to search for apartments
    Alert.alert(
      'Search Apartments',
      `Searching for apartments in ${city}...\n\nThis would connect to your apartment search API.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.appHeaderSolid }}>
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
            backgroundColor: theme.colors.background.appHeader,
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

          {/* Form Section - "Find Your Perfect Place" */}
          <View style={{
            backgroundColor: theme.colors.background.appHeader,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.1)',
            padding: 24,
            marginBottom: 24,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 24,
            }}>
              <Ionicons name="document-text-outline" size={20} color={iconGradient[0]} />
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#E2E8F0',
              }}>
                Find Your Perfect Place
              </Text>
            </View>

            {/* Looking to Lease or Buy? */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#E2E8F0',
                marginBottom: 8,
              }}>
                Looking to Lease or Buy?
              </Text>
              <TouchableOpacity
                onPress={() => setShowLeaseOrBuyPicker(true)}
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
                  color: leaseOrBuy ? '#FFFFFF' : '#64748B',
                  fontSize: 16,
                }}>
                  {leaseOrBuy
                    ? leaseOrBuyOptions.find(opt => opt.value === leaseOrBuy)?.label
                    : 'Select option'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* City */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#E2E8F0',
                marginBottom: 8,
              }}>
                City
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="e.g., Denver, Seattle, Austin"
                placeholderTextColor="#64748B"
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

            {/* Neighborhood(s) (Optional) */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#E2E8F0',
                marginBottom: 8,
              }}>
                Neighborhood(s) <Text style={{ color: '#64748B', fontWeight: '400' }}>(Optional)</Text>
              </Text>
              <TextInput
                value={neighborhoods}
                onChangeText={setNeighborhoods}
                placeholder="e.g., Capitol Hill, LoDo, Cherry Creek"
                placeholderTextColor="#64748B"
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
              <Text style={{
                fontSize: 12,
                color: '#64748B',
                marginTop: 6,
              }}>
                Separate multiple neighborhoods with commas
              </Text>
            </View>

            {/* Unit Size */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#E2E8F0',
                marginBottom: 8,
              }}>
                Unit Size
              </Text>
              <TouchableOpacity
                onPress={() => setShowUnitSizePicker(true)}
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
                  color: unitSize ? '#FFFFFF' : '#64748B',
                  fontSize: 16,
                }}>
                  {unitSize
                    ? unitSizeOptions.find(opt => opt.value === unitSize)?.label
                    : 'Select size'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Purchase Budget */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#E2E8F0',
                marginBottom: 8,
              }}>
                Purchase Budget
              </Text>
              <TextInput
                value={purchaseBudget}
                onChangeText={setPurchaseBudget}
                placeholder="e.g., 350000"
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

            {/* Target Closing Date */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#E2E8F0',
                marginBottom: 8,
              }}>
                Target Closing Date
              </Text>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: 'rgba(96, 165, 250, 0.3)',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}>
                <TextInput
                  value={targetClosingDate}
                  onChangeText={setTargetClosingDate}
                  placeholder="mm/dd/yyyy"
                  placeholderTextColor="#64748B"
                  style={{
                    flex: 1,
                    color: '#FFFFFF',
                    fontSize: 16,
                  }}
                />
                <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
              </View>
            </View>

            {/* Pets? */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#E2E8F0',
                marginBottom: 8,
              }}>
                Pets?
              </Text>
              <TouchableOpacity
                onPress={() => setShowPetsPicker(true)}
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
                  color: pets ? '#FFFFFF' : '#64748B',
                  fontSize: 16,
                }}>
                  {pets
                    ? petsOptions.find(opt => opt.value === pets)?.label
                    : 'Select option'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Must-Have Features (Optional) */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#E2E8F0',
                marginBottom: 16,
              }}>
                Must-Have Features <Text style={{ color: '#64748B', fontWeight: '400' }}>(Optional)</Text>
              </Text>
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                {FEATURES.map((feature) => (
                  <TouchableOpacity
                    key={feature.id}
                    onPress={() => toggleFeature(feature.id)}
                    activeOpacity={0.7}
                    style={{
                      width: '48%',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 12,
                    }}
                  >
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: selectedFeatures.has(feature.id)
                        ? iconGradient[0]
                        : 'rgba(96, 165, 250, 0.3)',
                      backgroundColor: selectedFeatures.has(feature.id)
                        ? iconGradient[0]
                        : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {selectedFeatures.has(feature.id) && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={{
                      color: '#E2E8F0',
                      fontSize: 14,
                      flex: 1,
                    }} numberOfLines={2}>
                      {feature.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Search Button */}
            <TouchableOpacity
              onPress={handleSearch}
              activeOpacity={0.8}
              style={{
                marginTop: 8,
              }}
            >
              <LinearGradient
                colors={['#06B6D4', '#3B82F6']}
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
                <Ionicons name="business-outline" size={20} color="#FFFFFF" />
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  Search Apartments & Homes
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Sponsored ad at bottom – category-specific */}
          <CategoryAdCard categorySlug={categorySlug} />
        </View>
      </ScrollView>

      {/* Lease or Buy Picker Modal */}
      <Modal
        visible={showLeaseOrBuyPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLeaseOrBuyPicker(false)}
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
              Looking to Lease or Buy?
            </Text>
            {leaseOrBuyOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  setLeaseOrBuy(option.value);
                  setShowLeaseOrBuyPicker(false);
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
              onPress={() => setShowLeaseOrBuyPicker(false)}
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

      {/* Unit Size Picker Modal */}
      <Modal
        visible={showUnitSizePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUnitSizePicker(false)}
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
              Unit Size
            </Text>
            {unitSizeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  setUnitSize(option.value);
                  setShowUnitSizePicker(false);
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
              onPress={() => setShowUnitSizePicker(false)}
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

      {/* Pets Picker Modal */}
      <Modal
        visible={showPetsPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPetsPicker(false)}
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
              Pets?
            </Text>
            {petsOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  setPets(option.value);
                  setShowPetsPicker(false);
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
              onPress={() => setShowPetsPicker(false)}
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
