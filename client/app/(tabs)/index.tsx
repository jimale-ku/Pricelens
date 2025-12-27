/**
 * Home Screen - PriceLens Homepage
 * Figma Reference: Homepage – Universal Search + Categories
 */

import { ScrollView } from "react-native";
import Navbar from "@/components/Navbar";
import CategoryTabs from "@/components/CategoryTabs";
import HeroSearch from "@/components/home/HeroSearch";
import CategoryGrid from "@/components/CategoryGrid";
import StatsSection from "@/components/home/StatsSection";

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-[#0B1020]" showsVerticalScrollIndicator={false}>
      <Navbar />
      <CategoryTabs />
      <HeroSearch />
      <CategoryGrid />
      <StatsSection />
    </ScrollView>
  );
}
