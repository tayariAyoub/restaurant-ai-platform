"use client";

import { ChefHat, Flame, Sparkles } from "lucide-react";
import { useState } from "react";

export const DEFAULT_RESTAURANT_LOADING_VIDEO_SRC = "/videos/bella-napoli-loading.mp4";

type RestaurantPageSkeletonProps = {
  loadingVideoSrc?: string | null;
};

export default function RestaurantPageSkeleton({
  loadingVideoSrc = DEFAULT_RESTAURANT_LOADING_VIDEO_SRC,
}: RestaurantPageSkeletonProps = {}) {
  const [videoReady, setVideoReady] = useState(false);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const shouldRenderVideo = Boolean(loadingVideoSrc) && !videoUnavailable;

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[#120c08] text-white" aria-label="Loading restaurant">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(185,72,45,.26),transparent_20rem),radial-gradient(circle_at_78%_18%,rgba(199,154,73,.18),transparent_24rem),linear-gradient(135deg,#070403_0%,#1b100b_48%,#090504_100%)]" />
      {shouldRenderVideo && (
        <video
          aria-hidden="true"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          src={loadingVideoSrc || undefined}
          onCanPlay={() => setVideoReady(true)}
          onError={() => {
            setVideoUnavailable(true);
            setVideoReady(false);
          }}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${videoReady ? "opacity-45" : "opacity-0"}`}
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,4,3,.92),rgba(18,12,8,.72)_46%,rgba(18,12,8,.42)),radial-gradient(circle_at_74%_22%,rgba(199,154,73,.16),transparent_24rem)]" />
      <div className="absolute inset-0 opacity-[.16] [background-image:radial-gradient(circle_at_20%_20%,rgba(255,244,220,.9)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c79a49]/20 bg-[radial-gradient(circle,rgba(185,72,45,.30),rgba(45,27,19,.10)_46%,transparent_70%)] blur-sm sm:h-[36rem] sm:w-[36rem]" />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-16 text-center sm:px-6" aria-live="polite">
        <div className="w-full max-w-xl">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-white/18 bg-white/[.08] shadow-[0_24px_80px_rgba(185,72,45,.28)] backdrop-blur-xl">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-[#c79a49]/35 bg-[#1b100b]/80 text-[#f8dfb2]">
              <ChefHat size={24} />
            </span>
          </div>

          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.07] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/62 backdrop-blur">
            <Sparkles size={13} className="text-[#c79a49]" /> Bella Napoli
          </p>

          <h1 className="mt-5 font-display text-5xl font-semibold leading-none text-white sm:text-7xl">
            Preparing Bella Napoli
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-base leading-7 text-white/64">
            The oven is warming. Setting your table...
          </p>

          <div className="mx-auto mt-9 flex max-w-xs items-center justify-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c79a49]/45" />
            <span className="grid h-11 w-11 animate-pulse place-items-center rounded-full border border-[#c79a49]/25 bg-[#2d1b13]/80 text-[#f4d59b] shadow-[0_0_48px_rgba(199,154,73,.22)]">
              <Flame size={18} />
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c79a49]/45" />
          </div>

          <div className="mx-auto mt-8 h-1 w-40 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#b9482d] via-[#c79a49] to-[#f8dfb2]" />
          </div>
        </div>
      </section>
    </main>
  );
}
