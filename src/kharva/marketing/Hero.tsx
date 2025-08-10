"use client";

import * as React from "react";
import { Anchor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface HeroProps {
  title: string;
  titleGu?: string;
  subtitle?: string;
  subtitleGu?: string;
  description?: string;
  descriptionGu?: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  backgroundImage?: string;
  className?: string;
}

export function Hero({
  title,
  titleGu,
  subtitle,
  subtitleGu,
  description,
  descriptionGu,
  primaryAction,
  secondaryAction,
  backgroundImage,
  className,
}: HeroProps) {
  return (
    <section
      className={cn(
        "relative min-h-[70vh] flex items-center justify-center overflow-hidden",
        className
      )}
      aria-labelledby="hero-title"
      role="banner"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900" aria-hidden="true">
        {backgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
            style={{ backgroundImage: `url(${backgroundImage})` }}
            role="img"
            aria-label="Maritime heritage background"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center text-white">
        <div className="flex justify-center mb-6" aria-hidden="true">
          <div className="relative">
            <Anchor className="h-20 w-20 text-yellow-400 drop-shadow-lg" aria-label="Maritime anchor symbol" />
            <div className="absolute inset-0 animate-pulse">
              <Anchor className="h-20 w-20 text-yellow-300 opacity-50" />
            </div>
          </div>
        </div>

        <header className="space-y-3 mb-6">
          <h1 id="hero-title" className="text-4xl md:text-6xl font-bold leading-tight">
            {title}
          </h1>
          {titleGu && (
            <h2 className="text-2xl md:text-4xl font-semibold text-yellow-300" lang="gu">
              {titleGu}
            </h2>
          )}
        </header>

        {(subtitle || subtitleGu) && (
          <div className="space-y-1 mb-5">
            {subtitle && <p className="text-xl md:text-2xl text-blue-100 font-medium">{subtitle}</p>}
            {subtitleGu && (
              <p className="text-lg md:text-xl text-blue-200" lang="gu">
                {subtitleGu}
              </p>
            )}
          </div>
        )}

        {(description || descriptionGu) && (
          <div className="max-w-3xl mx-auto space-y-2 mb-6">
            {description && <p className="text-lg md:text-xl text-blue-100 leading-relaxed">{description}</p>}
            {descriptionGu && (
              <p className="text-base md:text-lg text-blue-200 leading-relaxed" lang="gu">
                {descriptionGu}
              </p>
            )}
          </div>
        )}

        {(primaryAction || secondaryAction) && (
          <nav className="flex flex-col sm:flex-row gap-4 justify-center items-center" aria-label="Primary navigation actions">
            {primaryAction && (
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-semibold px-8 py-3 text-lg" asChild>
                <a href={primaryAction.href}> {primaryAction.label} </a>
              </Button>
            )}
            {secondaryAction && (
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3 text-lg" asChild>
                <a href={secondaryAction.href}> {secondaryAction.label} </a>
              </Button>
            )}
          </nav>
        )}
      </div>
    </section>
  );
}


