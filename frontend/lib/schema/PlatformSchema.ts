import { z } from "zod";

const NonEmptyStringSchema = z.string().trim().min(1);
const ColorValueSchema = NonEmptyStringSchema;
const InternalOrExternalHrefSchema = z.string().trim().refine(
  (value) => value.startsWith("/") || value.startsWith("#") || z.string().url().safeParse(value).success,
  "Expected an internal path, anchor, or absolute URL",
);
const ImageUrlSchema = z.string().trim().url();

export const ThemeColorsSchema = z.object({
  brand: z.object({
    primary: ColorValueSchema,
    secondary: ColorValueSchema,
  }).strict(),
  surface: z.object({
    default: ColorValueSchema,
    alt: ColorValueSchema,
  }).strict(),
  text: z.object({
    primary: ColorValueSchema,
    secondary: ColorValueSchema,
  }).strict(),
  status: z.object({
    success: ColorValueSchema,
    warning: ColorValueSchema,
    error: ColorValueSchema,
  }).strict(),
}).strict();

export const ThemeTypographySchema = z.object({
  heading_font: NonEmptyStringSchema,
  body_font: NonEmptyStringSchema,
}).strict();

export const ThemeGeometrySchema = z.object({
  radius_button: NonEmptyStringSchema,
  radius_card: NonEmptyStringSchema,
  section_spacing: NonEmptyStringSchema,
}).strict();

export const ThemeSchema = z.object({
  preset: NonEmptyStringSchema,
  colors: ThemeColorsSchema,
  typography: ThemeTypographySchema,
  geometry: ThemeGeometrySchema,
}).strict();

export const SeoSchema = z.object({
  title: NonEmptyStringSchema,
  description: NonEmptyStringSchema,
  canonical: z.string().trim().url(),
  og_image: ImageUrlSchema,
  robots: z.enum(["index,follow", "noindex,nofollow", "index,nofollow", "noindex,follow"]),
  locale: NonEmptyStringSchema,
}).strict();

export const SocialLinksSchema = z.record(NonEmptyStringSchema, z.string().trim().url());
export const OpeningHoursSchema = z.record(NonEmptyStringSchema, NonEmptyStringSchema);

export const RestaurantIdentitySchema = z.object({
  tenant_id: NonEmptyStringSchema,
  restaurant_name: NonEmptyStringSchema,
  slug: NonEmptyStringSchema,
  cuisine: NonEmptyStringSchema,
  city: NonEmptyStringSchema,
  country: NonEmptyStringSchema,
  address: NonEmptyStringSchema,
  phone: NonEmptyStringSchema,
  email: z.string().trim().email(),
  opening_hours: OpeningHoursSchema,
  social_links: SocialLinksSchema,
}).strict();

export const NavigationLinkSchema = z.object({
  label: NonEmptyStringSchema,
  href: InternalOrExternalHrefSchema,
}).strict();

export const NavigationSchema = z.object({
  logo_text: NonEmptyStringSchema,
  links: z.array(NavigationLinkSchema).min(1),
  primary_cta_label: NonEmptyStringSchema,
  primary_cta_href: InternalOrExternalHrefSchema,
}).strict();

export const FooterSchema = z.object({
  address: NonEmptyStringSchema,
  phone: NonEmptyStringSchema,
  email: z.string().trim().email(),
  opening_hours: OpeningHoursSchema,
  social_links: SocialLinksSchema,
}).strict();

export const BlockSettingsSchema = z.object({
  spacing: NonEmptyStringSchema,
  visibility: z.enum(["visible", "hidden", "draft"]),
  background: NonEmptyStringSchema,
  animation: NonEmptyStringSchema,
}).strict();

export const BlockAiMetadataSchema = z.object({
  editable: z.boolean(),
  generated: z.boolean(),
  prompt: z.string(),
}).strict();

export const BaseBlockSchema = z.object({
  id: NonEmptyStringSchema,
  component_id: NonEmptyStringSchema,
  type: NonEmptyStringSchema,
  variant: NonEmptyStringSchema,
  enabled: z.boolean(),
  order: z.number().int().nonnegative(),
  settings: BlockSettingsSchema,
  ai: BlockAiMetadataSchema,
}).strict();

export const HeroBlockSchema = BaseBlockSchema.extend({
  type: z.literal("hero"),
  props: z.object({
    headline: NonEmptyStringSchema,
    subheadline: NonEmptyStringSchema,
    image_url: ImageUrlSchema,
    cta_text: NonEmptyStringSchema,
    cta_href: InternalOrExternalHrefSchema,
  }).strict(),
}).strict();

export const StoryBlockSchema = BaseBlockSchema.extend({
  type: z.literal("story"),
  props: z.object({
    title: NonEmptyStringSchema,
    body_text: NonEmptyStringSchema,
    image_url: ImageUrlSchema,
    image_position: z.enum(["left", "right", "top", "bottom"]),
  }).strict(),
}).strict();

export const BlockSchema = z.discriminatedUnion("type", [
  HeroBlockSchema,
  StoryBlockSchema,
]);

export const PageSchema = z.object({
  layout: NonEmptyStringSchema,
  seo: SeoSchema,
  blocks: z.array(BlockSchema).min(1),
}).strict();

export const RestaurantConfigSchema = z.object({
  schema_version: z.literal("1.0.0").default("1.0.0"),
  identity: RestaurantIdentitySchema,
  domain: z.string().trim().url(),
  theme: ThemeSchema,
  navigation: NavigationSchema,
  footer: FooterSchema,
  pages: z.record(NonEmptyStringSchema, PageSchema),
}).strict();

export type ThemeColors = z.infer<typeof ThemeColorsSchema>;
export type ThemeTypography = z.infer<typeof ThemeTypographySchema>;
export type ThemeGeometry = z.infer<typeof ThemeGeometrySchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type Seo = z.infer<typeof SeoSchema>;
export type SocialLinks = z.infer<typeof SocialLinksSchema>;
export type OpeningHours = z.infer<typeof OpeningHoursSchema>;
export type RestaurantIdentity = z.infer<typeof RestaurantIdentitySchema>;
export type NavigationLink = z.infer<typeof NavigationLinkSchema>;
export type Navigation = z.infer<typeof NavigationSchema>;
export type Footer = z.infer<typeof FooterSchema>;
export type BlockSettings = z.infer<typeof BlockSettingsSchema>;
export type BlockAiMetadata = z.infer<typeof BlockAiMetadataSchema>;
export type BaseBlock = z.infer<typeof BaseBlockSchema>;
export type HeroBlock = z.infer<typeof HeroBlockSchema>;
export type StoryBlock = z.infer<typeof StoryBlockSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type Page = z.infer<typeof PageSchema>;
export type RestaurantConfig = z.infer<typeof RestaurantConfigSchema>;
