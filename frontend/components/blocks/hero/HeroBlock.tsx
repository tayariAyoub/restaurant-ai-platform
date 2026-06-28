import type { HeroBlock as HeroBlockConfig } from "@/lib/schema/PlatformSchema";
import HeroEditorial from "./variants/HeroEditorial";
import HeroMinimal from "./variants/HeroMinimal";
import HeroSplit from "./variants/HeroSplit";

export type HeroVariantName = "editorial" | "minimal" | "split";

type HeroBlockProps = {
  block: HeroBlockConfig;
};

export default function HeroBlock({ block }: HeroBlockProps) {
  const Component = resolveHeroVariant(block.variant);

  return <Component {...block.props} />;
}

function resolveHeroVariant(variant: string) {
  switch (variant) {
    case "minimal":
      return HeroMinimal;
    case "split":
      return HeroSplit;
    case "editorial":
    default:
      return HeroEditorial;
  }
}
