/**
 * Profile Service - Persist user profile (name, email, zip, phone, avatar)
 * Uses AsyncStorage. Avatar URI is stored; on native we try to copy to documentDirectory so it persists.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pricelens-profile';
const AVATAR_FILENAME = 'profile_avatar.jpg';

export interface ProfileData {
  name: string;
  email: string;
  zipCode: string;
  phone: string;
  avatarUri: string | null;
}

const defaultProfile: ProfileData = {
  name: '',
  email: '',
  zipCode: '',
  phone: '',
  avatarUri: null,
};

export async function getProfile(): Promise<ProfileData> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...defaultProfile };
    const parsed = JSON.parse(stored) as Partial<ProfileData>;
    return {
      name: parsed.name ?? '',
      email: parsed.email ?? '',
      zipCode: parsed.zipCode ?? '',
      phone: parsed.phone ?? '',
      avatarUri: parsed.avatarUri ?? null,
    };
  } catch {
    return { ...defaultProfile };
  }
}

export async function saveProfile(profile: ProfileData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/**
 * Persist picked image: copy to documentDirectory when available, otherwise return URI as-is.
 * Call this with the URI from expo-image-picker and then save the returned URI in profile.
 */
export async function saveAvatarFromUri(sourceUri: string): Promise<string> {
  try {
    // Try to use expo-file-system if available (native platforms)
    const FileSystem = require('expo-file-system');
    if (FileSystem && FileSystem.documentDirectory) {
      const destUri = `${FileSystem.documentDirectory}${AVATAR_FILENAME}`;
      await FileSystem.copyAsync({ from: sourceUri, to: destUri });
      console.log('✅ Avatar saved to:', destUri);
      return destUri;
    }
  } catch (error) {
    console.warn('⚠️ Could not copy avatar to documentDirectory, using original URI:', error);
  }
  // Fallback: return original URI (works for web or if file-system fails)
  console.log('📸 Using original avatar URI:', sourceUri);
  return sourceUri;
}
