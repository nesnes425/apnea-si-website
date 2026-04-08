import { siteConfig } from "@/lib/config";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <h1 className="text-4xl font-bold text-navy md:text-5xl">
        {siteConfig.name}
      </h1>
      <p className="mt-4 max-w-lg text-center text-lg text-body">
        {siteConfig.description}
      </p>
      <div className="mt-8 flex gap-4">
        <a
          href="/tecaji"
          className="rounded-lg bg-gold px-6 py-3 font-medium text-white transition-colors hover:bg-gold-hover"
        >
          Tečaji
        </a>
        <a
          href="/treningi"
          className="rounded-lg border-2 border-navy px-6 py-3 font-medium text-navy transition-colors hover:bg-navy hover:text-white"
        >
          Treningi
        </a>
      </div>
    </main>
  );
}
