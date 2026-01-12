/**
 * Profile Tab Screen
 */

import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '@/components/AppHeader';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Navigate to login page
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <AppHeader />
        
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          {/* Profile Header */}
          <View style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.1)',
            padding: 32,
            marginBottom: 24,
            alignItems: 'center',
          }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="person" size={40} color="#3B82F6" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>
              Profile
            </Text>
            <Text style={{ fontSize: 14, color: '#94A3B8' }}>
              Manage your account and preferences
            </Text>
          </View>

          {/* Settings Options */}
          <View style={{ gap: 12, marginBottom: 24 }}>
            {[
              { icon: 'person-outline', title: 'Account Settings', desc: 'Update your profile information' },
              { icon: 'notifications-outline', title: 'Notifications', desc: 'Manage notification preferences' },
              { icon: 'location-outline', title: 'Location', desc: 'Set your default location' },
              { icon: 'card-outline', title: 'Payment Methods', desc: 'Manage payment options' },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(148, 163, 184, 0.1)',
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <Ionicons name={item.icon as any} size={24} color="#94A3B8" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                    {item.desc}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.3)',
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#EF4444' }}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
