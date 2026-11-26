import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { OrderOptionsSection } from "@/components/OrderOptionsSection";
import { FeaturedMenuHighlights } from "@/components/FeaturedMenuHighlights";
import { AboutSection } from "@/components/AboutSection";
import { AmenitiesGrid } from "@/components/AmenitiesGrid";
import { ReviewsSection } from "@/components/ReviewsSection";
import { LocationFooter } from "@/components/LocationFooter";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { fetchMenuItems } from "@/lib/firebase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const { items } = await fetchMenuItems();

  return (
    <main className="min-h-screen bg-[#FAF4EA] flex flex-col selection:bg-[#C8942D]/25 selection:text-[#2E0710]">
      <Navbar />
      <Hero />
      <OrderOptionsSection />
      <FeaturedMenuHighlights initialDishes={items} />
      <AboutSection />
      <AmenitiesGrid />
      <ReviewsSection />
      <LocationFooter />
      <FloatingCartButton />
    </main>
  );
}
