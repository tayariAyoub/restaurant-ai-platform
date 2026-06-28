type HomepageImageProps = {
  src: string;
  alt: string;
  treatment: string;
  priority?: boolean;
};

export default function HomepageImage({ src, alt, treatment, priority = false }: HomepageImageProps) {
  if (!src) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(200,75,49,.18),transparent_24rem),radial-gradient(circle_at_18%_82%,rgba(198,161,91,.14),transparent_22rem),linear-gradient(135deg,#070403,#1c130e_48%,#080604)]" />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`absolute inset-0 h-full w-full object-cover ${treatment}`}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
