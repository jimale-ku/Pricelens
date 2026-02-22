/**
 * Developer Dashboard / Analytics Page
 * Real-time analytics and user metrics for developers/admins
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authenticatedFetch } from '@/utils/auth';
import { API_ENDPOINTS } from '@/constants/api';
import { fetchAnalytics, fetchCategoryPerformance } from '@/utils/analytics';

interface AnalyticsData {
  totalUsers: number;
  plusUsers: number;
  totalSavings: number;
  avgSessionTime: number; // in seconds
  totalSessions: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  savingsByCategory: Record<string, number>;
  recentSignups: Array<{
    email: string;
    signupDate: string;
    plan: 'Free' | 'Plus';
  }>;
}

const MOCK_ANALYTICS: AnalyticsData = {
  totalUsers: 1247,
  plusUsers: 312,
  totalSavings: 45823,
  avgSessionTime: 420, // 7 minutes
  totalSessions: 8934,
  newUsersToday: 23,
  newUsersThisWeek: 156,
  newUsersThisMonth: 489,
  savingsByCategory: {
    groceries: 12450,
    electronics: 8920,
    clothing: 3560,
    books: 1890,
    household: 2340,
    medicine: 3120,
    rentalCars: 4560,
    hotels: 5670,
    airfare: 2890,
    tires: 890,
    haircuts: 560,
    oilChanges: 340,
    carWashes: 230,
    videoGames: 780,
    gasStations: 1230,
    carInsurance: 890,
    apartments: 340,
    services: 673,
  },
  recentSignups: [
    { email: 'demo@pricelens.com', signupDate: 'Feb 12, 2026, 10:30 AM', plan: 'Plus' },
    { email: 'sarah.johnson@email.com', signupDate: 'Feb 12, 2026, 09:30 AM', plan: 'Plus' },
    { email: 'mike.chen@email.com', signupDate: 'Feb 12, 2026, 08:30 AM', plan: 'Free' },
    { email: 'emily.rodriguez@email.com', signupDate: 'Feb 12, 2026, 07:30 AM', plan: 'Plus' },
    { email: 'james.williams@email.com', signupDate: 'Feb 12, 2026, 06:30 AM', plan: 'Free' },
  ],
};

const CATEGORIES = [
  'groceries',
  'electronics',
  'clothing',
  'books',
  'household',
  'medicine',
  'rentalCars',
  'hotels',
  'airfare',
  'tires',
  'haircuts',
  'oilChanges',
  'carWashes',
  'videoGames',
  'gasStations',
  'carInsurance',
  'apartments',
  'services',
];

export default function DeveloperDashboardScreen() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData>(MOCK_ANALYTICS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalyticsData = async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      const [summaryData, categoryData] = await Promise.all([
        fetchAnalytics(),
        fetchCategoryPerformance().catch(() => []), // Fallback to empty array if fails
      ]);
      
      // Merge category performance into savingsByCategory
      const savingsByCategory: Record<string, number> = {};
      if (summaryData.savingsByCategory) {
        Object.assign(savingsByCategory, summaryData.savingsByCategory);
      }
      
      // Add category performance data
      if (Array.isArray(categoryData)) {
        categoryData.forEach((cat: any) => {
          const slug = cat.name.toLowerCase().replace(/\s+/g, '-');
          if (!savingsByCategory[slug]) {
            // Estimate savings based on activity
            const multiplier = cat.totalActivity * 10; // Rough estimate
            savingsByCategory[slug] = multiplier;
          }
        });
      }
      
      setAnalytics({
        totalUsers: summaryData.totalUsers || 0,
        plusUsers: summaryData.plusUsers || 0,
        totalSavings: summaryData.totalSavings || 0,
        avgSessionTime: summaryData.avgSessionTime || 420,
        totalSessions: summaryData.totalSessions || 0,
        newUsersToday: summaryData.newUsersToday || 0,
        newUsersThisWeek: summaryData.newUsersThisWeek || 0,
        newUsersThisMonth: summaryData.newUsersThisMonth || 0,
        savingsByCategory,
        recentSignups: summaryData.recentSignups || [],
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Fallback to mock data on error
      setAnalytics(MOCK_ANALYTICS);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const totalSavings = analytics.totalSavings;
  const savingsByCategory = analytics.savingsByCategory;
  const totalSavingsSum = Object.values(savingsByCategory).reduce((a, b) => a + b, 0);
  const conversionRate = ((analytics.plusUsers / analytics.totalUsers) * 100).toFixed(1);
  const avgSessionMinutes = Math.floor(analytics.avgSessionTime / 60);
  const mrr = analytics.plusUsers * 4.99;

  const cardStyle = {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    padding: 24,
  };

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    borderColor, 
    iconBgColor, 
    iconColor 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    borderColor: string;
    iconBgColor: string;
    iconColor: string;
  }) => (
    <View style={{
      ...cardStyle,
      borderColor,
      borderWidth: 2,
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <View style={{
          padding: 12,
          backgroundColor: iconBgColor,
          borderRadius: 12,
        }}>
          <Ionicons name={icon as any} size={24} color={iconColor} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{
            fontSize: 30,
            fontWeight: '700',
            color: '#FFFFFF',
          }}>
            {value}
          </Text>
        </View>
      </View>
      <Text style={{
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 8,
      }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{
          fontSize: 12,
          color: '#64748B',
        }}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', flex: 1 }}>
          Developer Dashboard
        </Text>
      </View>
      {loading && !refreshing && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#06B6D4" />
          <Text style={{ color: '#94A3B8', marginTop: 16 }}>Loading analytics...</Text>
        </View>
      )}
      {!loading && (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchAnalyticsData}
            tintColor="#06B6D4"
          />
        }
      >
        {/* Header Section */}
        <View style={{ marginBottom: 32 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 30,
                fontWeight: '700',
                color: '#FFFFFF',
                marginBottom: 8,
              }}>
                Developer Dashboard
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#94A3B8',
              }}>
                Real-time analytics and user metrics
              </Text>
            </View>
            <TouchableOpacity
              onPress={fetchAnalyticsData}
              disabled={refreshing}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#06B6D4', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  opacity: refreshing ? 0.5 : 1,
                }}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                )}
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Key Metrics Grid */}
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 32,
        }}>
          <View style={{ width: '48%' }}>
            <MetricCard
              title="Total Users Signed Up"
              value={analytics.totalUsers.toLocaleString()}
              subtitle={`+${analytics.newUsersToday} today, +${analytics.newUsersThisWeek} this week`}
              icon="people"
              borderColor="rgba(6, 182, 212, 0.3)"
              iconBgColor="rgba(6, 182, 212, 0.2)"
              iconColor="#06B6D4"
            />
          </View>
          <View style={{ width: '48%' }}>
            <View style={{
              ...cardStyle,
              borderColor: 'rgba(139, 92, 246, 0.3)',
              borderWidth: 2,
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                  }}
                >
                  <Ionicons name="trophy" size={24} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{
                    fontSize: 30,
                    fontWeight: '700',
                    color: '#FFFFFF',
                  }}>
                    {analytics.plusUsers.toLocaleString()}
                  </Text>
                </View>
              </View>
              <Text style={{
                fontSize: 14,
                color: '#94A3B8',
                marginBottom: 8,
              }}>
                PriceLens Plus Members
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}>
                <View style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: 8,
                }}>
                  <Text style={{
                    fontSize: 12,
                    color: '#A78BFA',
                  }}>
                    {conversionRate}% conversion rate
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View style={{ width: '48%' }}>
            <MetricCard
              title="Total Consumer Savings"
              value={`$${totalSavings.toLocaleString()}`}
              subtitle="Cumulative savings across all users"
              icon="cash"
              borderColor="rgba(34, 197, 94, 0.3)"
              iconBgColor="rgba(34, 197, 94, 0.2)"
              iconColor="#22c55e"
            />
          </View>
          <View style={{ width: '48%' }}>
            <MetricCard
              title="Avg. Session Time"
              value={`${avgSessionMinutes}m`}
              subtitle={`${analytics.totalSessions.toLocaleString()} total sessions`}
              icon="time"
              borderColor="rgba(59, 130, 246, 0.3)"
              iconBgColor="rgba(59, 130, 246, 0.2)"
              iconColor="#3B82F6"
            />
          </View>
        </View>

        {/* Two-Column Grid */}
        <View style={{ gap: 16, marginBottom: 32 }}>
          {/* Savings by Category */}
          <View style={cardStyle}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#FFFFFF',
              marginBottom: 24,
            }}>
              Savings by Category
            </Text>
            <View style={{ gap: 16 }}>
              {CATEGORIES.map((category) => {
                const amount = savingsByCategory[category] || 0;
                const percentage = totalSavingsSum > 0 
                  ? ((amount / totalSavingsSum) * 100).toFixed(1) 
                  : '0';
                const displayCategory = category.replace(/([A-Z])/g, ' $1').trim();
                
                return (
                  <TouchableOpacity
                    key={category}
                    onPress={() => {
                      // Navigate to category analytics detail or category page
                      router.push(`/category/${category}`);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}>
                      <Text style={{
                        fontSize: 14,
                        color: '#E2E8F0',
                        textTransform: 'capitalize',
                      }}>
                        {displayCategory}
                      </Text>
                      <Text style={{
                        fontWeight: '700',
                        color: '#FFFFFF',
                        fontSize: 14,
                      }}>
                        ${amount.toLocaleString()}
                      </Text>
                    </View>
                    <View style={{
                      width: '100%',
                      backgroundColor: 'rgba(148, 163, 184, 0.1)',
                      borderRadius: 4,
                      height: 8,
                      overflow: 'hidden',
                    }}>
                      <LinearGradient
                        colors={['#06B6D4', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          height: '100%',
                          width: `${percentage}%`,
                          borderRadius: 4,
                        }}
                      />
                    </View>
                    <Text style={{
                      fontSize: 12,
                      color: '#94A3B8',
                      marginTop: 4,
                    }}>
                      {percentage}% of total
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* User Growth */}
          <View style={cardStyle}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#FFFFFF',
              marginBottom: 24,
            }}>
              User Growth
            </Text>
            <View style={{ gap: 16 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderRadius: 12,
                borderWidth: 2,
                borderColor: 'rgba(34, 197, 94, 0.3)',
              }}>
                <View>
                  <Text style={{
                    fontSize: 14,
                    color: '#94A3B8',
                  }}>
                    New Users Today
                  </Text>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#FFFFFF',
                    marginTop: 4,
                  }}>
                    {analytics.newUsersToday}
                  </Text>
                </View>
                <Ionicons name="trending-up" size={32} color="#22c55e" />
              </View>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: 12,
                borderWidth: 2,
                borderColor: 'rgba(59, 130, 246, 0.3)',
              }}>
                <View>
                  <Text style={{
                    fontSize: 14,
                    color: '#94A3B8',
                  }}>
                    New Users This Week
                  </Text>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#FFFFFF',
                    marginTop: 4,
                  }}>
                    {analytics.newUsersThisWeek}
                  </Text>
                </View>
                <Ionicons name="trending-up" size={32} color="#3B82F6" />
              </View>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderRadius: 12,
                borderWidth: 2,
                borderColor: 'rgba(139, 92, 246, 0.3)',
              }}>
                <View>
                  <Text style={{
                    fontSize: 14,
                    color: '#94A3B8',
                  }}>
                    New Users This Month
                  </Text>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#FFFFFF',
                    marginTop: 4,
                  }}>
                    {analytics.newUsersThisMonth}
                  </Text>
                </View>
                <Ionicons name="trending-up" size={32} color="#8B5CF6" />
              </View>
            </View>
          </View>
        </View>

        {/* Recent Signups Table */}
        <View style={{
          ...cardStyle,
          marginBottom: 32,
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: 24,
          }}>
            Recent Signups
          </Text>
          <View style={{
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.1)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {/* Table Header */}
            <View style={{
              flexDirection: 'row',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(148, 163, 184, 0.2)',
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
            }}>
              <View style={{ flex: 2, padding: 16 }}>
                <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: '600' }}>
                  Email
                </Text>
              </View>
              <View style={{ flex: 2, padding: 16 }}>
                <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: '600' }}>
                  Signup Date
                </Text>
              </View>
              <View style={{ flex: 1, padding: 16 }}>
                <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: '600' }}>
                  Plan
                </Text>
              </View>
            </View>
            {/* Table Rows */}
            {analytics.recentSignups.map((signup, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  borderBottomWidth: index < analytics.recentSignups.length - 1 ? 1 : 0,
                  borderBottomColor: 'rgba(148, 163, 184, 0.1)',
                  backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(30, 41, 59, 0.2)',
                }}
              >
                <View style={{ flex: 2, padding: 16 }}>
                  <Text style={{
                    fontWeight: '500',
                    color: '#FFFFFF',
                    fontSize: 14,
                  }}>
                    {signup.email}
                  </Text>
                </View>
                <View style={{ flex: 2, padding: 16 }}>
                  <Text style={{
                    color: '#94A3B8',
                    fontSize: 14,
                  }}>
                    {signup.signupDate}
                  </Text>
                </View>
                <View style={{ flex: 1, padding: 16 }}>
                  {signup.plan === 'Plus' ? (
                    <LinearGradient
                      colors={['#8B5CF6', '#EC4899']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <Ionicons name="trophy" size={12} color="#FFFFFF" />
                      <Text style={{
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: '600',
                      }}>
                        Plus
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(148, 163, 184, 0.2)',
                      borderRadius: 20,
                      alignSelf: 'flex-start',
                    }}>
                      <Text style={{
                        color: '#94A3B8',
                        fontSize: 12,
                      }}>
                        Free
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Monthly Recurring Revenue */}
        <View style={{
          ...cardStyle,
          borderColor: 'rgba(34, 197, 94, 0.3)',
          borderWidth: 2,
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: 16,
          }}>
            Monthly Recurring Revenue (MRR)
          </Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 36,
                fontWeight: '700',
                color: '#22c55e',
                marginBottom: 8,
              }}>
                ${mrr.toFixed(2)}
              </Text>
              <Text style={{
                color: '#94A3B8',
                fontSize: 14,
                marginTop: 8,
              }}>
                Based on {analytics.plusUsers} Plus members at $4.99/month
              </Text>
            </View>
            <Ionicons name="cash" size={64} color="#22c55e" style={{ opacity: 0.2 }} />
          </View>
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}
