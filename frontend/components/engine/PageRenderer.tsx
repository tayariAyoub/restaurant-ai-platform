import type { ReactNode } from "react";

import { getBlockComponent } from "@/lib/engine/BlockRegistry";
import type { Block, HeroBlock, Page, StoryBlock } from "@/lib/schema/PlatformSchema";

type PageRendererProps = {
  page: Page;
};

export default function PageRenderer({ page }: PageRendererProps) {
  const orderedBlocks = [...page.blocks]
    .filter((block) => block.enabled)
    .sort((left, right) => left.order - right.order);

  return (
    <>
      {orderedBlocks.map((block) => (
        <RenderedBlock key={block.id} block={block}>
          <BlockRenderer block={block} />
        </RenderedBlock>
      ))}
    </>
  );
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "hero":
      return <HeroBlockRenderer block={block} />;
    case "story":
      return <StoryBlockRenderer block={block} />;
  }
}

function HeroBlockRenderer({ block }: { block: HeroBlock }) {
  const Component = getBlockComponent(block.component_id, "hero");

  if (!Component) {
    return <MissingBlock componentId={block.component_id} />;
  }

  return <Component {...block.props} />;
}

function StoryBlockRenderer({ block }: { block: StoryBlock }) {
  const Component = getBlockComponent(block.component_id, "story");

  if (!Component) {
    return <MissingBlock componentId={block.component_id} />;
  }

  return <Component {...block.props} />;
}

function RenderedBlock({ block, children }: { block: Block; children: ReactNode }) {
  return (
    <div data-page-block-id={block.id} data-page-block-component-id={block.component_id}>
      {children}
    </div>
  );
}

function MissingBlock({ componentId }: { componentId: string }) {
  return (
    <div
      role="note"
      className="rounded border border-dashed border-slate-200 p-2 text-xs text-slate-400"
      data-missing-block={componentId}
    >
      Missing block: {componentId}
    </div>
  );
}
