/**
 * Hero Search Section - Universal Search
 * Pixel-perfect Figma design implementation
 */

import { View, Text, TextInput, TouchableOpacity, useWindowDimensions, Animated, Pressable } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from "react";
import Svg, { Circle, Path } from 'react-native-svg';

export default function HeroSearch() {
  const [searchText, setSearchText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const isLarge = width >= 1024;

  // Floating animation for search icon
  const floatAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const trendingSearches = [
    'iPhone 15',
    'AirPods Pro',
    'Nike Running Shoes',
    'LEGO Sets',
    'Instant Pot',
    'Organic Milk',
  ];

  return (
    <View style={{
      backgroundColor: 'rgba(21, 27, 40, 0.6)', // glass-card background-color
      color: '#E8EDF4', // rgb(232, 237, 244) - var(--foreground)
      borderRadius: 24, // rounded-3xl
      padding: isMobile ? 40 : isLarge ? 48 : 40, // p-10 lg:p-12
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)', // border-white/10
      position: 'relative',
      overflow: 'hidden',
      textAlign: 'center', // text-center (for child text elements)
    }}>
      {/* Decorative Background Blobs */}
      {/* Blue blob - top left */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: '25%',
        width: 500,
        height: 500,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderRadius: 250,
        opacity: 0.6,
      }} />

      {/* Purple blob - bottom right */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        right: '25%',
        width: 500,
        height: 500,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderRadius: 250,
        opacity: 0.6,
      }} />

      {/* Cyan blob - center */}
      <View style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 300,
        height: 300,
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        borderRadius: 150,
        opacity: 0.5,
        transform: [{ translateX: -150 }, { translateY: -150 }],
      }} />

      {/* Content Wrapper - .max-w-4xl.mx-auto.relative.z-10 */}
      <View style={{ 
        maxWidth: 896, // max-w-4xl (var(--container-4xl))
        alignSelf: 'center', // mx-auto
        position: 'relative', 
        zIndex: 10,
        width: 268.689, // exact Figma computed width
        margin: 0,
        padding: 0,
        backgroundColor: 'transparent',
        paddingTop: 20 
      }}>
        
        {/* Heading Section - .flex.items-center.justify-center.gap-4.mb-6 */}
        <View style={{ 
          flexDirection: 'row',
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 16, // gap-4
          marginBottom: 24, // mb-6
          overflow: 'visible'
        }}>
          {/* Icon with Gradient Background and Float Animation */}
          <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6', '#06B6D4']} // blue-500 via purple-500 to cyan-500
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }} // bg-gradient-to-br (to bottom right)
              style={{
                padding: 16,
                borderRadius: 16,
                shadowColor: '#3B82F6', // shadow-blue-500
                shadowOffset: { 
                  width: 0, 
                  height: 10, // shadow-lg
                },
                shadowOpacity: 0.5, // /50 (50% opacity)
                shadowRadius: 15, // shadow-lg blur
                elevation: 15, // Android shadow-lg
              }}
            >
              <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Circle cx="11" cy="11" r="8" />
                <Path d="m21 21-4.3-4.3" />
              </Svg>
            </LinearGradient>
          </Animated.View>

          {/* Title and Subtitle Container - .text-left */}
          <View style={{ 
            width: 172.745,
            height: 124.007,
            textAlign: 'left',
            margin: 0,
            padding: 0,
          }}>
            {/* H2 with gradient text styling - h2.gradient-text.text-4xl.lg:text-5xl.font-bold.mb-1 */}
            <Text style={{
              fontSize: isLarge ? 48 : 36, // text-4xl (36px) / lg:text-5xl (48px)
              fontWeight: '700', // font-bold
              letterSpacing: -0.6,
              lineHeight: isLarge ? 56 : 44, // responsive line height
              color: '#B9B6FF', // Blue-purple gradient color (indigo → lavender, medium-low saturation, high brightness)
              marginBottom: 4, // mb-1
              margin: 0,
              padding: 0,
            }}>
              Universal Search
            </Text>
            
            {/* P with text-xs slate-400 font-medium styling */}
            <Text style={{
              fontSize: 12,
              color: '#94A3B8', // slate-400
              fontWeight: '500', // medium
              margin: 0,
              padding: 0,
            }}>
              Powered by AI • 100+ Retailers
            </Text>
          </View>
        </View>

        {/* Description - p.text-slate-300.mb-8.text-lg.max-w-2xl.mx-auto.leading-relaxed */}
        <Text style={{
          color: '#CBD5E1', // slate-300 color
          marginBottom: 32, // mb-8 (32px)
          fontSize: 18, // text-lg
          lineHeight: 29.25, // leading-relaxed
          maxWidth: 672, // max-w-2xl (42rem = 672px)
          alignSelf: 'center', // mx-auto
          textAlign: 'center',
          margin: 0,
          padding: 0,
          width: 268.689, // exact Figma width
          height: 116.991, // exact Figma height
        }}>
          Search ANY product across <Text style={{ 
            color: '#60A5FA', // text-blue-400 (oklch(0.707 0.165 254.624))
            fontWeight: '600', // font-semibold
            fontSize: 18, // text-lg (inherited from parent)
          }}>100+ major{'\n'}retailers</Text>. Compare prices, find deals, and save{'\n'}money effortlessly.
        </Text>

        {/* Search Container - .flex.gap-3 */}
        <View style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 12, // gap-3 (calc(var(--spacing) * 3))
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          width: 268.689, // exact Figma computed width
          height: 63.978, // exact Figma computed height
          margin: 0,
          padding: 0,
          backgroundColor: 'transparent',
        }}>
          {/* Input Container - .flex-1.relative.group */}
          <View style={{ flex: 1, position: 'relative' }}>
            {/* Search Icon - svg.lucide.lucide-search.absolute.left-5.top-1/2 */}
            <Svg 
              width={20} // h-5 w-5
              height={20} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke={isInputFocused ? '#60A5FA' : '#94A3B8'} // text-slate-400, group-focus-within:text-blue-400
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: 'absolute',
                left: 20, // left-5
                top: '50%', // top-1/2
                transform: [{ translateY: -10 }], // -translate-y-1/2
                zIndex: 1,
              }}
            >
              <Circle cx="11" cy="11" r="8" />
              <Path d="m21 21-4.3-4.3" />
            </Svg>

            {/* Search Input - input.file:text-foreground... */}
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="Search for iPhone, LEGO, running shoes, coffee maker..."
              placeholderTextColor="#64748B" // placeholder:text-slate-500
              style={{
                display: 'flex',
                width: 133.137, // exact Figma computed width
                height: 63.978, // h-16 (calc(var(--spacing) * 16))
                paddingLeft: 56, // pl-14 
                paddingRight: 24, // pr-6
                backgroundColor: isInputFocused ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)', // bg-white/5, focus:bg-white/10
                borderWidth: 1,
                borderColor: isInputFocused ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)', // border-white/10, focus:border-blue-500/50
                borderRadius: 16, // rounded-2xl (var(--radius-2xl))
                color: '#FFFFFF', // text-white
                fontSize: 18, // text-lg
                textAlign: 'left', // text-align: start
                shadowColor: '#000000', // shadow-xl shadow-black/20
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.2,
                shadowRadius: 25,
                elevation: 20,
                outline: 'none',
              }}
            />
          </View>

          {/* Search Button - button.inline-flex.items-center.justify-center... */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
            >
              <LinearGradient
                colors={['#3B82F6', '#60A5FA', '#7DD3FC']} // animated-gradient bg-primary
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  display: 'flex',
                  width: 123.565, // exact Figma computed width
                  height: 63.978, // h-16 (calc(var(--spacing) * 16))
                  paddingVertical: 8, // py-2
                  paddingHorizontal: 40, // px-10
                  borderRadius: 16, // rounded-2xl (var(--radius-2xl))
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8, // gap-2 (calc(var(--spacing) * 2))
                  shadowColor: '#3B82F6', // shadow-blue-500/30
                  shadowOffset: { width: 0, height: 25 },
                  shadowOpacity: 0.3,
                  shadowRadius: 50,
                  elevation: 25,
                }}
              >
                <Text style={{
                  color: '#FFFFFF', // text-white
                  fontSize: 14, // text-sm
                  fontWeight: '700', // font-bold
                  lineHeight: 20,
                  textAlign: 'center',
                }}>
                  Search
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>

        {/* Trending Pills */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ color: 'rgb(148, 163, 184)', fontWeight: '500' }}>
            Trending:
          </Text>
          {trendingSearches.map((term, index) => (
            <Pressable
              key={term}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  backgroundColor: pressed ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: pressed ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 9999,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                }
              ]}
            >
              <Text style={{ color: 'rgb(203, 213, 225)', fontSize: 14 }}>
                {term}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
