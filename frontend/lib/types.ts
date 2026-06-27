export type User = {
  id: number;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "RESTAURANT_OWNER";
  is_active: boolean;
  created_at: string;
};

export type Theme = {
  id: number;
  key: string;
  name: string;
  description: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  button_style: string;
  homepage_style: string;
  menu_style: string;
  gallery_style: string;
};

export type MenuItem = {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: string;
  image_url: string;
  is_available: boolean;
  is_vegan: boolean;
  is_vegetarian: boolean;
  is_halal: boolean;
  allergens: string;
};

export type Category = {
  id: number;
  name: string;
  description: string;
  sort_order: number;
  items: MenuItem[];
};

export type RestaurantImage = {
  id: number;
  restaurant_id: number;
  image_type: "logo" | "hero" | "gallery" | "food";
  url: string;
  alt_text: string;
  sort_order: number;
  created_at: string;
};

export type Restaurant = {
  id: number;
  owner_id: number | null;
  theme_id: number | null;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  story: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  google_maps_url: string;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  opening_hours: string;
  logo_url: string;
  hero_image: string;
  reservation_url: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  button_style: string;
  homepage_style: string;
  menu_style: string;
  gallery_style: string;
  is_published: boolean;
  created_at: string;
  owner?: User | null;
  theme?: Theme | null;
  categories: Category[];
  images: RestaurantImage[];
};

export type RestaurantSummary = Pick<
  Restaurant,
  "id" | "owner_id" | "theme_id" | "name" | "slug" | "city" | "email" | "hero_image" | "is_published" | "created_at"
>;

export type PublicRestaurantSummary = Pick<
  Restaurant,
  "id" | "name" | "slug" | "city" | "hero_image" | "is_published" | "created_at"
>;

export type SetupChecklist = {
  information: boolean;
  opening_hours: boolean;
  branding: boolean;
  menu: boolean;
  design: boolean;
  chatbot: boolean;
};

export type RestaurantOverview = RestaurantSummary & {
  owner_name: string;
  owner_email: string;
  theme_name: string;
  menu_items: number;
  image_count: number;
  reservation_count: number;
  new_reservations: number;
  new_orders: number;
  conversation_count: number;
  unanswered_count: number;
  setup_percent: number;
  checklist: SetupChecklist;
};

export type Message = {
  id?: number;
  role: "user" | "assistant";
  content: string;
  is_unanswered?: boolean;
  created_at?: string;
};

export type Conversation = {
  id: string;
  restaurant_id: number;
  created_at: string;
  updated_at: string;
  visitor_name: string;
  visitor_email: string;
  messages: Message[];
};

export type ContactRequest = {
  id: number;
  restaurant_id: number;
  name: string;
  email: string;
  phone: string;
  party_size: number | null;
  requested_at: string;
  message: string;
  status: string;
  created_at: string;
};

export type DashboardStats = {
  restaurants: number;
  owners: number;
  reservations: number;
  conversations: number;
  unanswered: number;
  new_orders: number;
};

export type OrderItem = {
  id: number;
  menu_item_id: number | null;
  item_name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
  notes: string;
};

export type DeliveryAddress = {
  id: number;
  street: string;
  postal_code: string;
  city: string;
  instructions: string;
  latitude: string | null;
  longitude: string | null;
  approximate_distance_km: string | null;
};

export type DeliveryDriver = {
  id: number;
  restaurant_id: number;
  name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
};

export type DeliveryAssignment = {
  id: number;
  driver_id: number;
  status: string;
  assigned_at: string;
  updated_at: string;
  driver: DeliveryDriver;
};

export type RestaurantOrder = {
  id: number;
  public_id: string;
  restaurant_id: number;
  order_type: "PICKUP" | "EAT_IN" | "DELIVERY";
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes: string;
  subtotal: string;
  delivery_fee: string;
  total: string;
  estimated_minutes: number | null;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  delivery_address: DeliveryAddress | null;
  delivery_assignment: DeliveryAssignment | null;
  status_history: { id: number; status: string; note: string; created_at: string }[];
};
