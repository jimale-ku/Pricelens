import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { LogBox } from 'react-native';

export default function RootLayout() {
  // Suppress non-critical errors that don't affect functionality
  useEffect(() => {
    // Suppress expo-keep-awake errors (non-critical, doesn't affect app functionality)
    LogBox.ignoreLogs([
      'Unable to activate keep awake',
      'expo-keep-awake',
    ]);
    
    // Suppress ObjectDisposedException warnings (handled gracefully in code)
    LogBox.ignoreLogs([
      'ObjectDisposedException',
    ]);
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none', // Disable animations for instant navigation
        animationDuration: 0, // Ensure no animation delay
      }}
    >
      <Stack.Screen 
        name="(auth)/login" 
        options={{ 
          headerShown: false,
          animation: 'none',
          animationDuration: 0,
        }} 
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
          animation: 'none',
          animationDuration: 0,
        }} 
      />
      <Stack.Screen 
        name="category/[slug]" 
        options={{ 
          headerShown: false,
          animation: 'none',
          animationDuration: 0,
        }} 
      />
      <Stack.Screen 
        name="product/[id]" 
        options={{ 
          headerShown: false,
          animation: 'none',
          animationDuration: 0,
        }} 
      />
      <Stack.Screen 
        name="developer-dashboard" 
        options={{ 
          headerShown: false,
          animation: 'none',
          animationDuration: 0,
        }} 
      />
    </Stack>
  );
}
