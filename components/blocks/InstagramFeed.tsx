"use client";

import Script from "next/script";

export function InstagramFeed() {
  return (
    <>
      <Script
        src="https://elfsightcdn.com/platform.js"
        strategy="lazyOnload"
      />
      <div
        className="elfsight-app-005c7072-7cb0-4736-b556-a6a735f3276e"
        data-elfsight-app-lazy
      />
    </>
  );
}
