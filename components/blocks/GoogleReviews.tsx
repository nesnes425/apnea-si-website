"use client";

import Script from "next/script";

export function GoogleReviews() {
  return (
    <>
      <Script
        src="https://elfsightcdn.com/platform.js"
        strategy="lazyOnload"
      />
      <div
        className="elfsight-app-fc00927f-69c3-4c77-80de-88f026044b45"
        data-elfsight-app-lazy
      />
    </>
  );
}
