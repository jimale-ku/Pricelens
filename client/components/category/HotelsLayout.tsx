/**
 * Hotels Layout - Custom Layout for Card-Based Booking Site Comparison
 * 
 * Features:
 * - Search form: Destination, Guests, Check-in Date, Check-out Date (2x2 grid)
 * - Card-based results showing booking sites
 * - Hotel image, name, location, dates, guests, rating
 * - Booking site cards with logos, prices, "Book Now" buttons
 * - Summary cards (Lowest Price, Average Price, Potential Savings)
 */

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image, Linking } from "react-native";
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { getIconName } from '@/utils/iconMapper';

interface HotelsLayoutProps {
  categorySlug: string;
  categoryName: string;
  categoryDescription: string;
  categoryIcon: string;
  iconGradient: string[];
}

interface BookingSite {
  rank: number;
  siteName: string;
  siteLogo?: string;
  pricePerNight: number;
  totalPrice: number;
  bookingUrl?: string;
  priceDifference?: number;
}

interface HotelData {
  hotelName: string;
  location: string;
  hotelImage?: string;
  rating: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  bookingSites: BookingSite[];
  lowestPrice: number;
  averagePrice: number;
  potentialSavings: number;
}

export default function HotelsLayout({
  categorySlug,
  categoryName,
  categoryDescription,
  categoryIcon,
  iconGradient,
}: HotelsLayoutProps) {
  const [destination, setDestination] = useState('');
  const [guests, setGuests] = useState('2');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Reset state when category changes
  useEffect(() => {
    setDestination('');
    setGuests('2');
    setCheckIn('');
    setCheckOut('');
    setHotelData(null);
    setHasSearched(false);
    setLoading(false);
  }, [categorySlug]);

  const handleSearch = async () => {
    // Validate required fields
    if (!destination?.trim()) {
      Alert.alert('Missing Information', 'Please enter a destination (city or hotel name).');
      return;
    }
    if (!checkIn?.trim()) {
      Alert.alert('Missing Information', 'Please select a check-in date.');
      return;
    }
    if (!checkOut?.trim()) {
      Alert.alert('Missing Information', 'Please select a check-out date.');
      return;
    }
    if (!guests?.trim() || parseInt(guests) < 1) {
      Alert.alert('Missing Information', 'Please enter the number of guests.');
      return;
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkOutDate <= checkInDate) {
      Alert.alert('Invalid Dates', 'Check-out date must be after check-in date.');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const { API_ENDPOINTS } = require('../../constants/api');
      const apiUrl = API_ENDPOINTS.services.hotels(
        destination,
        checkIn,
        checkOut,
        parseInt(guests)
      );

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform backend data to HotelData format
      // Backend returns hotels, but we need to show booking sites for comparison
      if (Array.isArray(data) && data.length > 0) {
        // Get the first hotel as the main hotel
        const firstHotel = data[0];
        
        // Create booking sites from the hotel data
        // In a real implementation, this would come from booking site APIs
        // For now, we'll create mock booking sites with price variations
        const bookingSiteNames = ['Booking.com', 'Hotels.com', 'Expedia', 'Priceline', 'Agoda', 'Kayak'];
        const basePrice = typeof firstHotel.price === 'string' 
          ? parseFloat(firstHotel.price.replace(/[^0-9.]/g, '')) || 100 
          : firstHotel.price || 100;
        
        const bookingSites: BookingSite[] = bookingSiteNames.map((siteName, index) => {
          // Create price variation (first site has lowest price)
          const priceVariation = index * 15; // $15 difference between sites
          const pricePerNight = basePrice + priceVariation;
          const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
          const totalPrice = pricePerNight * nights;
          
          // Generate logo URL from Clearbit API
          const siteDomain = siteName.toLowerCase().replace('.com', '').replace(' ', '');
          const siteLogo = `https://logo.clearbit.com/${siteDomain}.com`;
          
          // Generate booking URL
          const bookingParams = new URLSearchParams({
            destination: destination,
            checkIn,
            checkOut,
            guests,
          });
          const bookingUrl = `https://www.${siteDomain}.com/search?${bookingParams.toString()}`;
          
          return {
            rank: index + 1,
            siteName,
            siteLogo,
            pricePerNight,
            totalPrice,
            bookingUrl,
            priceDifference: index > 0 ? priceVariation : 0,
          };
        });

        // Sort by price (lowest first)
        bookingSites.sort((a, b) => a.pricePerNight - b.pricePerNight);
        bookingSites.forEach((site, index) => {
          site.rank = index + 1;
          if (index > 0) {
            site.priceDifference = site.pricePerNight - bookingSites[0].pricePerNight;
          }
        });

        const lowestPrice = bookingSites[0].pricePerNight;
        const averagePrice = bookingSites.reduce((sum, s) => sum + s.pricePerNight, 0) / bookingSites.length;
        const potentialSavings = averagePrice - lowestPrice;

        const hotelInfo: HotelData = {
          hotelName: firstHotel.hotel || firstHotel.title || destination,
          location: firstHotel.address || destination,
          hotelImage: `https://source.unsplash.com/400x300/?hotel,${encodeURIComponent(destination)}`,
          rating: firstHotel.rating || 4.0,
          checkIn,
          checkOut,
          nights: Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)),
          guests: parseInt(guests),
          bookingSites,
          lowestPrice,
          averagePrice,
          potentialSavings,
        };

        setHotelData(hotelInfo);
      } else {
        setHotelData(null);
        Alert.alert('No Results', 'No hotels found for your search. Please try different dates or location.');
      }
    } catch (error: any) {
      console.error('Error searching hotels:', error);
      Alert.alert('Error', error.message || 'Failed to search hotels. Please try again.');
      setHotelData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (bookingUrl?: string, siteName?: string) => {
    if (bookingUrl) {
      Linking.openURL(bookingUrl);
    } else {
      // Fallback: construct booking URL
      const params = new URLSearchParams({
        destination,
        checkIn,
        checkOut,
        guests,
      });
      const fallbackUrl = `https://www.booking.com/search.html?${params.toString()}`;
      Linking.openURL(fallbackUrl);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const iconName = getIconName(categoryIcon);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <AppHeader />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Section */}
        <View style={{ padding: 20, paddingTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MaskedView
              maskElement={
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={iconName as any} size={32} color="white" />
                  <Text style={{ fontSize: 28, fontWeight: 'bold', marginLeft: 12, color: 'white' }}>
                    {categoryName}
                  </Text>
                </View>
              }
            >
              <LinearGradient
                colors={iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 100 }}
              >
                <Ionicons name={iconName as any} size={32} color="transparent" />
                <Text style={{ fontSize: 28, fontWeight: 'bold', marginLeft: 12, color: 'transparent' }}>
                  {categoryName}
                </Text>
              </LinearGradient>
            </MaskedView>
          </View>
          <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>
            {categoryDescription}
          </Text>
        </View>

        {/* Search Form - 2x2 Grid */}
        <View style={{ padding: 20, paddingTop: 0 }}>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
              Find Hotels
            </Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {/* Destination */}
            <View style={{ flex: 1, minWidth: '48%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="location" size={18} color="#06B6D4" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>Destination</Text>
              </View>
              <TextInput
                style={{
                  backgroundColor: '#1F2937',
                  borderRadius: 12,
                  padding: 14,
                  color: '#FFFFFF',
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#374151',
                }}
                placeholder="City or Hotel Name"
                placeholderTextColor="#6B7280"
                value={destination}
                onChangeText={setDestination}
              />
            </View>

            {/* Guests */}
            <View style={{ flex: 1, minWidth: '48%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="people" size={18} color="#06B6D4" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>Guests</Text>
              </View>
              <TextInput
                style={{
                  backgroundColor: '#1F2937',
                  borderRadius: 12,
                  padding: 14,
                  color: '#FFFFFF',
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#374151',
                }}
                placeholder="2"
                placeholderTextColor="#6B7280"
                value={guests}
                onChangeText={setGuests}
                keyboardType="numeric"
              />
            </View>

            {/* Check-in Date */}
            <View style={{ flex: 1, minWidth: '48%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="calendar" size={18} color="#06B6D4" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>Check-in</Text>
              </View>
              <TextInput
                style={{
                  backgroundColor: '#1F2937',
                  borderRadius: 12,
                  padding: 14,
                  color: '#FFFFFF',
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#374151',
                }}
                placeholder="Select date"
                placeholderTextColor="#6B7280"
                value={checkIn}
                onChangeText={setCheckIn}
                // Note: For production, use a proper date picker component
              />
            </View>

            {/* Check-out Date */}
            <View style={{ flex: 1, minWidth: '48%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="calendar" size={18} color="#06B6D4" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>Check-out</Text>
              </View>
              <TextInput
                style={{
                  backgroundColor: '#1F2937',
                  borderRadius: 12,
                  padding: 14,
                  color: '#FFFFFF',
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#374151',
                }}
                placeholder="Select date"
                placeholderTextColor="#6B7280"
                value={checkOut}
                onChangeText={setCheckOut}
                // Note: For production, use a proper date picker component
              />
            </View>
          </View>

          {/* Search Button */}
          <TouchableOpacity
            onPress={handleSearch}
            disabled={loading}
            style={{ marginTop: 20 }}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  Search Hotels
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {loading && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#06B6D4" />
            <Text style={{ color: '#9CA3AF', marginTop: 12 }}>Searching hotels...</Text>
          </View>
        )}

        {!loading && hasSearched && hotelData && (
          <View style={{ padding: 20, paddingTop: 0 }}>
            {/* Hotel Info Section */}
            <View style={{ marginBottom: 24 }}>
              {/* Hotel Image */}
              {hotelData.hotelImage && (
                <Image
                  source={{ uri: hotelData.hotelImage }}
                  style={{
                    width: 128,
                    height: 128,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: '#06B6D4',
                    marginBottom: 16,
                    alignSelf: 'center',
                  }}
                  resizeMode="cover"
                />
              )}

              {/* Hotel Name */}
              <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
                {hotelData.hotelName}
              </Text>

              {/* Badges Row */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                  <Ionicons name="location" size={14} color="#06B6D4" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#FFFFFF', fontSize: 12 }}>{hotelData.location}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                  <Ionicons name="calendar" size={14} color="#06B6D4" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#FFFFFF', fontSize: 12 }}>
                    {formatDate(hotelData.checkIn)} - {formatDate(hotelData.checkOut)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 12 }}>{hotelData.nights} nights</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 12 }}>{hotelData.guests} guests</Text>
                </View>
              </View>

              {/* Star Rating */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(hotelData.rating) ? 'star' : 'star-outline'}
                    size={20}
                    color={star <= Math.round(hotelData.rating) ? '#FBBF24' : '#6B7280'}
                    style={{ marginHorizontal: 2 }}
                  />
                ))}
              </View>
            </View>

            {/* Summary Cards */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              <View style={{ flex: 1, backgroundColor: '#1F2937', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#06B6D4' }}>
                <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 4 }}>Lowest Price</Text>
                <Text style={{ color: '#06B6D4', fontSize: 20, fontWeight: 'bold' }}>
                  {formatPrice(hotelData.lowestPrice)}/night
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#1F2937', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#3B82F6' }}>
                <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 4 }}>Average Price</Text>
                <Text style={{ color: '#3B82F6', fontSize: 20, fontWeight: 'bold' }}>
                  {formatPrice(hotelData.averagePrice)}/night
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#1F2937', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#06B6D4' }}>
                <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 4 }}>Potential Savings</Text>
                <Text style={{ color: '#10B981', fontSize: 20, fontWeight: 'bold' }}>
                  {formatPrice(hotelData.potentialSavings)}
                </Text>
              </View>
            </View>

            {/* Booking Site Cards */}
            <View style={{ gap: 16 }}>
              {hotelData.bookingSites.map((site) => (
                <View
                  key={site.rank}
                  style={{
                    backgroundColor: site.rank === 1 ? '#1F2937' : '#111827',
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: site.rank === 1 ? 2 : 1,
                    borderColor: site.rank === 1 ? '#06B6D4' : '#374151',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {/* Left Side */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <View
                          style={{
                            backgroundColor: site.rank === 1 ? '#10B981' : '#6B7280',
                            borderRadius: 20,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            marginRight: 8,
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>
                            #{site.rank}
                          </Text>
                        </View>
                        {site.siteLogo ? (
                          <Image
                            source={{ uri: site.siteLogo }}
                            style={{ width: 32, height: 32, borderRadius: 8, marginRight: 8 }}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#374151', marginRight: 8 }} />
                        )}
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                          {site.siteName}
                        </Text>
                      </View>
                      <View style={{ marginBottom: 8 }}>
                        <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
                          {formatPrice(site.pricePerNight)}/night
                        </Text>
                      </View>
                      {site.rank === 1 && (
                        <View style={{ marginBottom: 8 }}>
                          <LinearGradient
                            colors={['#06B6D4', '#8B5CF6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              alignSelf: 'flex-start',
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 12,
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                              Best Price
                            </Text>
                          </LinearGradient>
                        </View>
                      )}
                      {site.priceDifference && site.priceDifference > 0 && (
                        <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
                          +{formatPrice(site.priceDifference)} more
                        </Text>
                      )}
                    </View>

                    {/* Right Side */}
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={{
                          color: site.rank === 1 ? '#10B981' : '#FFFFFF',
                          fontSize: 28,
                          fontWeight: 'bold',
                          marginBottom: 4,
                        }}
                      >
                        {formatPrice(site.totalPrice)}
                      </Text>
                      <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 12 }}>Total</Text>
                      <TouchableOpacity
                        onPress={() => handleBookNow(site.bookingUrl, site.siteName)}
                        style={{ marginBottom: 8 }}
                      >
                        <LinearGradient
                          colors={['#3B82F6', '#2563EB']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginRight: 6 }}>
                            Book Now
                          </Text>
                          <Ionicons name="open-outline" size={16} color="#FFFFFF" />
                        </LinearGradient>
                      </TouchableOpacity>
                      {site.rank === 1 && (
                        <TouchableOpacity>
                          <LinearGradient
                            colors={['#10B981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              paddingHorizontal: 20,
                              paddingVertical: 10,
                              borderRadius: 8,
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                              Save
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {!loading && hasSearched && !hotelData && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="bed-outline" size={64} color="#6B7280" />
            <Text style={{ color: '#9CA3AF', fontSize: 16, marginTop: 16, textAlign: 'center' }}>
              No hotels found. Please try different search criteria.
            </Text>
          </View>
        )}
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}
