"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/config";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-navy">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-[72px]">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image
            src="/images/logo-apnea-horizontal-v3.png"
            alt="Apnea Slovenija"
            width={224}
            height={64}
            className="h-14 w-auto"
          />
        </Link>

        {/* Desktop nav — right aligned */}
        <nav className="hidden lg:flex items-center gap-8">
          {siteConfig.nav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const children = "children" in item ? item.children : undefined;
            if (children) {
              return (
                <div key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1 text-[15px] tracking-[0.03em] font-body transition-colors ${
                      isActive
                        ? "text-gold font-medium"
                        : "text-white/80 hover:text-gold"
                    }`}
                  >
                    {item.label}
                  </Link>
                  <div className="invisible absolute left-0 top-full min-w-56 translate-y-3 border border-white/10 bg-navy-dark py-3 opacity-0 shadow-lg transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {children.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block px-5 py-2.5 text-[14px] font-body transition-colors ${
                            childActive
                              ? "text-gold font-medium"
                              : "text-white/80 hover:text-gold"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[15px] tracking-[0.03em] font-body transition-colors ${
                  isActive
                    ? "text-gold font-medium"
                    : "text-white/80 hover:text-gold"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-white/80"
          aria-label={mobileOpen ? "Zapri meni" : "Odpri meni"}
        >
          {mobileOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="lg:hidden bg-navy-dark border-t border-white/10">
          <div className="px-6 py-6 flex flex-col gap-1">
            {siteConfig.nav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const children = "children" in item ? item.children : undefined;
              if (children) {
                return (
                  <div key={item.href} className="py-2">
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block py-2 text-[16px] font-body transition-colors ${
                        isActive
                          ? "text-gold font-medium"
                          : "text-white/80 hover:text-gold"
                      }`}
                    >
                      {item.label}
                    </Link>
                    <div className="mt-1 flex flex-col border-l border-white/10 pl-4">
                      {children.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={`py-2 text-[14px] font-body transition-colors ${
                              childActive
                                ? "text-gold font-medium"
                                : "text-white/60 hover:text-gold"
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`py-3 text-[16px] font-body transition-colors ${
                    isActive
                      ? "text-gold font-medium"
                      : "text-white/80 hover:text-gold"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
