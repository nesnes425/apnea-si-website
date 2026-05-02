"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import {
  OPEN_CONSENT_EVENT,
  readConsent,
  writeConsent,
  type ConsentState,
} from "@/lib/cookie-consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

const FB_PIXEL_INIT = (id: string) => `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${id}');
fbq('track', 'PageView');`;

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsToggle, setAnalyticsToggle] = useState(true);
  const [marketingToggle, setMarketingToggle] = useState(true);

  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      setConsent(stored);
      setAnalyticsToggle(stored.analytics);
      setMarketingToggle(stored.marketing);
    } else {
      setShowBanner(true);
    }

    const reopen = () => {
      const current = readConsent();
      if (current) {
        setAnalyticsToggle(current.analytics);
        setMarketingToggle(current.marketing);
      }
      setShowSettings(true);
      setShowBanner(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  function persist(next: ConsentState) {
    writeConsent(next);
    setConsent(next);
    setShowBanner(false);
    setShowSettings(false);
  }

  function acceptAll() {
    persist({ analytics: true, marketing: true });
  }

  function rejectAll() {
    persist({ analytics: false, marketing: false });
  }

  function saveSelection() {
    persist({ analytics: analyticsToggle, marketing: marketingToggle });
  }

  return (
    <>
      {consent?.analytics && GA_ID ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true });`}
          </Script>
        </>
      ) : null}

      {consent?.marketing && FB_PIXEL_ID ? (
        <Script id="fb-pixel" strategy="afterInteractive">
          {FB_PIXEL_INIT(FB_PIXEL_ID)}
        </Script>
      ) : null}

      {showBanner ? (
        <div
          role="dialog"
          aria-label="Nastavitve piškotkov"
          aria-modal="false"
          className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-gold bg-navy-dark text-white shadow-2xl"
        >
          <div className="mx-auto max-w-5xl px-6 py-6 md:py-8">
            {!showSettings ? (
              <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="font-heading text-[18px] font-semibold mb-2">
                    Spletna stran uporablja piškotke
                  </p>
                  <p className="font-body text-[14px] leading-[1.6] text-white/80">
                    Nujne piškotke uporabljamo za delovanje spletne strani in
                    plačila. Z vašim soglasjem lahko uporabljamo tudi
                    analitične in trženjske piškotke, da lažje izboljšujemo
                    stran in oglase. Več v{" "}
                    <a
                      href="/zasebnost"
                      className="text-gold hover:text-gold-hover underline"
                    >
                      politiki zasebnosti
                    </a>
                    .
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 md:flex-nowrap md:justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="bg-transparent border border-white/40 hover:bg-white/10"
                  >
                    Nastavitve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={rejectAll}
                    className="bg-transparent border border-white/40 hover:bg-white/10"
                  >
                    Zavrni vse
                  </Button>
                  <Button type="button" size="sm" onClick={acceptAll}>
                    Sprejmi vse
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-heading text-[18px] font-semibold mb-4">
                  Nastavitve piškotkov
                </p>
                <div className="space-y-4 mb-6">
                  <ToggleRow
                    label="Nujni"
                    description="Potrebni za delovanje strani in plačila. Vedno aktivni."
                    checked
                    disabled
                    onChange={() => undefined}
                  />
                  <ToggleRow
                    label="Analitični"
                    description="Google Analytics — anonimna statistika obiska, nam pomaga izboljševati stran."
                    checked={analyticsToggle}
                    onChange={setAnalyticsToggle}
                  />
                  <ToggleRow
                    label="Trženjski"
                    description="Meta Pixel — meritev učinkovitosti oglasov in remarketing."
                    checked={marketingToggle}
                    onChange={setMarketingToggle}
                  />
                </div>
                <div className="flex flex-wrap gap-3 justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={rejectAll}
                    className="bg-transparent border border-white/40 hover:bg-white/10"
                  >
                    Zavrni vse
                  </Button>
                  <Button type="button" size="sm" onClick={saveSelection}>
                    Shrani izbiro
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
};

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: ToggleRowProps) {
  return (
    <label className="flex items-start gap-4 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-gold shrink-0 disabled:opacity-50"
      />
      <span>
        <span className="block font-body text-[15px] font-medium text-white">
          {label}
        </span>
        <span className="block font-body text-[13px] text-white/60 leading-[1.5] mt-0.5">
          {description}
        </span>
      </span>
    </label>
  );
}
