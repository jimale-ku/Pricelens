/**
 * Login/Signup Screen - PriceLens
 * Converted from Figma design to React Native
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AppLogo from '../../components/AppLogo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

// Icon components (inline for simplicity)
const EyeIcon = ({ size = 40, color = '#FFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MailIcon = ({ size = 20, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="m22 6-10 7L2 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LockIcon = ({ size = 20, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 11H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const UserIcon = ({ size = 20, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (!email || !password || (isSignUp && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (isSignUp) {
      Alert.alert('Success', 'Account created successfully! Welcome to PriceLens!');
    }

    // Navigate to home
    router.replace('/(tabs)');
  };

  const handleDemoLogin = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Background gradient effect */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <LinearGradient
              colors={['#0B1020', 'rgba(139, 92, 246, 0.1)', '#0B1020']}
              style={{ flex: 1 }}
            />
          </View>

          <View style={{ maxWidth: 448, width: '100%', alignSelf: 'center', zIndex: 10 }}>
            {/* Logo and Branding */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40, // Fully circular (half of 80)
                  backgroundColor: '#0F172A', // Dark background
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)', // Subtle border for professionalism
                }}
              >
                {/* App Logo - Fills the circular div (90% of container for padding) */}
                <AppLogo size={72} color="#FFFFFF" />
              </View>
              
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: 'bold',
                  color: '#FFF',
                  marginBottom: 8,
                }}
              >
                PriceLens
              </Text>
              <Text style={{ fontSize: 14, color: '#94A3B8', fontWeight: '500' }}>
                See the Savings Clearly
              </Text>
            </View>

            {/* Login/Signup Card */}
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                padding: 32,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.3,
                shadowRadius: 25,
                elevation: 15,
              }}
            >
              {/* Header */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#FFF',
                    marginBottom: 8,
                  }}
                >
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </Text>
                <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                  {isSignUp
                    ? 'Start saving money with smart price comparisons'
                    : 'Sign in to continue your savings journey'}
                </Text>
              </View>

              {/* Form Fields */}
              <View style={{ gap: 16 }}>
                {/* Name Field (Sign Up only) */}
                {isSignUp && (
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#CBD5E1',
                        marginBottom: 8,
                      }}
                    >
                      Full Name
                    </Text>
                    <View style={{ position: 'relative' }}>
                      <View
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: 12,
                          zIndex: 1,
                        }}
                      >
                        <UserIcon />
                      </View>
                      <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="John Doe"
                        placeholderTextColor="#64748B"
                        style={{
                          width: '100%',
                          paddingLeft: 44,
                          paddingRight: 16,
                          paddingVertical: 12,
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderWidth: 1,
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: 8,
                          color: '#FFF',
                          fontSize: 16,
                        }}
                      />
                    </View>
                  </View>
                )}

                {/* Email Field */}
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#CBD5E1',
                      marginBottom: 8,
                    }}
                  >
                    Email
                  </Text>
                  <View style={{ position: 'relative' }}>
                    <View
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: 12,
                        zIndex: 1,
                      }}
                    >
                      <MailIcon />
                    </View>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      placeholderTextColor="#64748B"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={{
                        width: '100%',
                        paddingLeft: 44,
                        paddingRight: 16,
                        paddingVertical: 12,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 8,
                        color: '#FFF',
                        fontSize: 16,
                      }}
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#CBD5E1',
                      marginBottom: 8,
                    }}
                  >
                    Password
                  </Text>
                  <View style={{ position: 'relative' }}>
                    <View
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: 12,
                        zIndex: 1,
                      }}
                    >
                      <LockIcon />
                    </View>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#64748B"
                      secureTextEntry
                      style={{
                        width: '100%',
                        paddingLeft: 44,
                        paddingRight: 16,
                        paddingVertical: 12,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 8,
                        color: '#FFF',
                        fontSize: 16,
                      }}
                    />
                  </View>
                </View>

                {/* Submit Button */}
                <Pressable
                  onPress={handleSubmit}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <LinearGradient
                    colors={['#3B82F6', '#A855F7', '#06B6D4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                      shadowColor: '#3B82F6',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                      elevation: 8,
                    }}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>
                      {isSignUp ? 'Sign Up' : 'Sign In'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>

              {/* Divider */}
              <View style={{ marginTop: 24, marginBottom: 16 }}>
                <View
                  style={{
                    position: 'relative',
                    height: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <View
                    style={{
                      position: 'absolute',
                      top: -10,
                      left: '50%',
                      transform: [{ translateX: -15 }],
                      backgroundColor: 'rgba(15, 23, 42, 0.5)',
                      paddingHorizontal: 8,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: '#94A3B8' }}>or</Text>
                  </View>
                </View>
              </View>

              {/* Demo Button */}
              <Pressable
                onPress={handleDemoLogin}
                style={({ pressed }) => ({
                  backgroundColor: pressed
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                })}
              >
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>
                  Try Demo Account
                </Text>
              </Pressable>

              {/* Toggle Sign In/Sign Up */}
              <View style={{ marginTop: 24, alignItems: 'center' }}>
                <Pressable onPress={() => setIsSignUp(!isSignUp)}>
                  <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                    {isSignUp
                      ? 'Already have an account? '
                      : "Don't have an account? "}
                    <Text style={{ color: '#60A5FA' }}>
                      {isSignUp ? 'Sign in' : 'Sign up'}
                    </Text>
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Features */}
            <View
              style={{
                marginTop: 32,
                flexDirection: 'row',
                gap: 16,
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>💰</Text>
                <Text style={{ fontSize: 12, color: '#94A3B8' }}>Save Money</Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>🔍</Text>
                <Text style={{ fontSize: 12, color: '#94A3B8' }}>Compare Prices</Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>📊</Text>
                <Text style={{ fontSize: 12, color: '#94A3B8' }}>Track Savings</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
