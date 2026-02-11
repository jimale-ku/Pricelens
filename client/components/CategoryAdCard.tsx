/**
 * Sponsored ad card shown at the bottom of Pattern A category pages.
 * Design matches: "ADVERTISEMENT" label, sponsor name, image, headline, body, CTA button.
 * Content is category-specific so you can monetize by advertising stores per category
 * (e.g. groceries category → grocery delivery ad).
 */

import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getAdForCategory } from '@/constants/categoryAds';

interface CategoryAdCardProps {
  categorySlug: string;
}

export default function CategoryAdCard({ categorySlug }: CategoryAdCardProps) {
  const ad = getAdForCategory(categorySlug);
  if (!ad) return null;

  const handleCtaPress = () => {
    if (ad.ctaUrl) {
      Linking.openURL(ad.ctaUrl).catch(() => {});
    }
  };

  return (
    <View
      style={{
        backgroundColor: 'rgba(30, 27, 50, 0.95)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 149, 168, 0.2)',
        overflow: 'hidden',
        marginTop: 32,
        marginBottom: 24,
      }}
    >
      {/* Header row: ADVERTISEMENT | Sponsored by X */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            color: 'rgba(148, 163, 184, 0.9)',
            fontWeight: '500',
            letterSpacing: 0.5,
          }}
        >
          {ad.label}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: 'rgba(148, 163, 184, 0.9)',
            fontWeight: '500',
          }}
          numberOfLines={1}
        >
          {ad.sponsorName}
        </Text>
      </View>

      {/* Image */}
      <View style={{ width: '100%', height: 160, backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <Image
          source={{ uri: ad.imageUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      {/* Headline */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: '#f1f5f9',
          paddingHorizontal: 16,
          paddingTop: 16,
          lineHeight: 24,
        }}
      >
        {ad.headline}
      </Text>

      {/* Body */}
      <Text
        style={{
          fontSize: 14,
          color: 'rgba(203, 213, 225, 0.9)',
          lineHeight: 20,
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
      >
        {ad.body}
      </Text>

      {/* CTA Button */}
      <TouchableOpacity
        onPress={handleCtaPress}
        activeOpacity={0.85}
        style={{
          marginHorizontal: 16,
          marginTop: 20,
          marginBottom: 20,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          colors={['#a78bfa', '#60a5fa']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            paddingHorizontal: 20,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
            {ad.ctaText}
          </Text>
          <Ionicons name="open-outline" size={18} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
