/**
 * Login/Signup Screen - PriceLens
 * Converted from Figma design to React Native
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import AppLogo from '../../components/AppLogo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';

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

// Google Logo Component
const GoogleIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <G>
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </G>
  </Svg>
);

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async () => {
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

    setIsLoading(true);
    try {
      if (isSignUp) {
        // Register new user
        const res = await fetch(API_ENDPOINTS.auth.register, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            password, 
            firstName: name.split(' ')[0] || name, 
            lastName: name.split(' ').slice(1).join(' ') || '' 
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          Alert.alert('Registration Failed', data?.message || 'Could not create account. Please try again.');
          return;
        }
        // Store tokens
        if (data.accessToken) {
          await AsyncStorage.setItem('accessToken', data.accessToken);
        }
        if (data.refreshToken) {
          await AsyncStorage.setItem('refreshToken', data.refreshToken);
        }
        Alert.alert('Success', 'Account created successfully! Welcome to PriceLens!');
      } else {
        // Login existing user
        const res = await fetch(API_ENDPOINTS.auth.login, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          Alert.alert('Login Failed', data?.message || 'Invalid email or password. Please try again.');
          return;
        }
        // Store tokens
        if (data.accessToken) {
          await AsyncStorage.setItem('accessToken', data.accessToken);
          console.log('✅ Access token stored');
        }
        if (data.refreshToken) {
          await AsyncStorage.setItem('refreshToken', data.refreshToken);
        }
        if (data.user) {
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
        }
      }
      // Navigate to home
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Error', error?.message || 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    router.replace('/(tabs)');
  };

  // Handle deep links for OAuth callback
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      try {
        if (url.startsWith('pricelens://auth/callback')) {
          const urlObj = new URL(url.replace('pricelens://', 'https://'));
          const dataParam = urlObj.searchParams.get('data');
          
          if (dataParam) {
            const authData = JSON.parse(decodeURIComponent(dataParam));
            
            // Store tokens
            if (authData.accessToken) {
              await AsyncStorage.setItem('accessToken', authData.accessToken);
            }
            if (authData.refreshToken) {
              await AsyncStorage.setItem('refreshToken', authData.refreshToken);
            }
            if (authData.user) {
              await AsyncStorage.setItem('user', JSON.stringify(authData.user));
            }
            
            setIsGoogleLoading(false);
            Alert.alert('Success', 'Signed in with Google successfully!');
            router.replace('/(tabs)');
          }
        } else if (url.startsWith('pricelens://auth/error')) {
          const urlObj = new URL(url.replace('pricelens://', 'https://'));
          const error = urlObj.searchParams.get('error');
          setIsGoogleLoading(false);
          Alert.alert('Sign In Failed', error || 'An error occurred during sign in');
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
        setIsGoogleLoading(false);
        Alert.alert('Error', 'Failed to process sign in. Please try again.');
      }
    };

    // Handle initial URL (if app was opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  const checkBackendConnection = async (): Promise<boolean> => {
    try {
      // Try to reach a simple endpoint (stores endpoint is usually available)
      const testUrl = `${API_BASE_URL}/stores`;
      console.log('🔍 Testing backend connection:', testUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const isReachable = response.ok || response.status < 500;
      console.log(isReachable ? '✅ Backend is reachable' : '❌ Backend returned error:', response.status);
      return isReachable;
    } catch (error: any) {
      console.error('❌ Backend connection check failed:', error.message);
      console.error('Backend URL:', API_BASE_URL);
      return false;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      
      // Check if backend is reachable before opening browser
      const isBackendReachable = await checkBackendConnection();
      
      if (!isBackendReachable) {
        setIsGoogleLoading(false);
        const troubleshootingSteps = [
          `❌ Cannot connect to backend server`,
          ``,
          `📍 Backend URL: ${API_BASE_URL}`,
          ``,
          `🔧 Troubleshooting Steps:`,
          ``,
          `1️⃣ Is backend running?`,
          `   Open terminal and run:`,
          `   cd server`,
          `   npm run start:dev`,
          ``,
          `2️⃣ Check IP address`,
          `   Your IP: 192.168.201.105`,
          `   Update if different in:`,
          `   client/constants/api.ts`,
          ``,
          `3️⃣ Same WiFi network?`,
          `   Phone and PC must be on same WiFi`,
          ``,
          `4️⃣ Test in browser:`,
          `   Open: ${API_BASE_URL}/api`,
          `   Should show Swagger API docs`,
          ``,
          `5️⃣ Firewall blocking?`,
          `   Allow port 3000 in Windows Firewall`,
        ].join('\n');
        
        Alert.alert(
          '⚠️ Backend Not Reachable',
          troubleshootingSteps,
          [
            { 
              text: 'Try Anyway', 
              onPress: () => {
                setIsGoogleLoading(true);
                proceedWithGoogleSignIn();
              },
              style: 'default'
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }
      
      proceedWithGoogleSignIn();
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setIsGoogleLoading(false);
      Alert.alert(
        'Error', 
        `Could not start Google sign-in.\n\nError: ${error.message || 'Unknown error'}\n\nBackend URL: ${API_BASE_URL}`
      );
    }
  };

  const proceedWithGoogleSignIn = async () => {
    try {
      const googleAuthUrl = `${API_BASE_URL}/auth/google?mobile=true`;
      console.log('🔐 Opening Google sign-in URL:', googleAuthUrl);
      
      const canOpen = await Linking.canOpenURL(googleAuthUrl);
      console.log('Can open URL:', canOpen);
      
      if (canOpen) {
        console.log('✅ Opening browser for Google sign-in...');
        await Linking.openURL(googleAuthUrl);
        // Keep loading state - will be cleared when deep link is handled or timeout
        // Set timeout to clear loading state if deep link doesn't arrive
        setTimeout(() => {
          if (isGoogleLoading) {
            console.warn('⏱️ Google sign-in timeout - no callback received');
            setIsGoogleLoading(false);
            Alert.alert(
              'Sign-In Timeout',
              'Did not receive callback from Google sign-in.\n\nPlease try again or check if backend is running.'
            );
          }
        }, 60000); // 60 second timeout
      } else {
        setIsGoogleLoading(false);
        Alert.alert(
          'Google Sign-In',
          `Cannot open URL automatically.\n\nPlease manually open this URL in your browser:\n\n${googleAuthUrl}\n\nAfter signing in, you'll be redirected back to the app.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Error opening Google sign-in:', error);
      setIsGoogleLoading(false);
      Alert.alert(
        'Error', 
        `Could not open Google sign-in.\n\nError: ${error.message}\n\nBackend URL: ${API_BASE_URL}\n\nMake sure backend is running!\n\nRun: cd server && npm run start:dev`
      );
    }
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
                  disabled={isLoading}
                  style={({ pressed }) => ({
                    opacity: pressed || isLoading ? 0.7 : 1,
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
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>
                        {isSignUp ? 'Sign Up' : 'Sign In'}
                      </Text>
                    )}
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

              {/* Google Sign In Button */}
              <Pressable
                onPress={handleGoogleSignIn}
                disabled={isGoogleLoading}
                style={({ pressed }) => ({
                  backgroundColor: pressed || isGoogleLoading 
                    ? 'rgba(255, 255, 255, 0.95)' 
                    : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  paddingVertical: 14,
                  borderRadius: 10,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 12,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                  opacity: isGoogleLoading ? 0.7 : 1,
                })}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color="#4285F4" />
                ) : (
                  <GoogleIcon size={20} />
                )}
                <Text 
                  style={{ 
                    color: '#1F2937', 
                    fontWeight: '600', 
                    fontSize: 16,
                    letterSpacing: 0.2,
                  }}
                >
                  {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                </Text>
              </Pressable>

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
