import type { Metadata } from "next";

import RestaurantWebsiteClient from "../RestaurantWebsiteClient";
import {
  fetchPublicRestaurant,
  generateRestaurantPageMetadata,
  type RestaurantPageProps,
} from "../restaurantPageData";

export async function generateMetadata({ params }: RestaurantPageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateRestaurantPageMetadata(slug, "gallery");
}

export default async function RestaurantGalleryPage({ params }: RestaurantPageProps) {
  const { slug } = await params;
  const restaurant = await fetchPublicRestaurant(slug);
  return <RestaurantWebsiteClient slug={slug} initialRestaurant={restaurant} page="gallery" />;
}
