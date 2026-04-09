import Link from "next/link";
import Image from "next/image";
import imageUrlBuilder from "@sanity/image-url";
import { sanityClient } from "@/lib/sanity/client";
import { getBlogPosts, getBlogPostCount } from "@/lib/sanity/queries";
import type { BlogPost } from "@/lib/sanity/types";
import type { Metadata } from "next";

const builder = imageUrlBuilder(sanityClient);

const POSTS_PER_PAGE = 12;

export const metadata: Metadata = {
  title: "Novice",
  description:
    "Nasveti, reportaže in novice iz sveta prostega potapljanja. Apnea Slovenija blog.",
};

interface Props {
  searchParams: Promise<{ stran?: string }>;
}

export default async function NovicePage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.stran) || 1);
  const offset = (page - 1) * POSTS_PER_PAGE;

  const [posts, totalCount] = await Promise.all([
    getBlogPosts(POSTS_PER_PAGE, offset),
    getBlogPostCount(),
  ]);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-4xl font-bold">Novice</h1>
        <p className="text-body font-body mt-3 text-lg">
          Nasveti, reportaže in novice iz sveta prostega potapljanja.
        </p>
      </header>

      {/* Post grid */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-muted-text font-body">Ni objav.</p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Strani"
          className="flex items-center justify-center gap-2 mt-16"
        >
          {page > 1 && (
            <Link
              href={page === 2 ? "/novice" : `/novice?stran=${page - 1}`}
              className="px-4 py-2 text-sm font-body border border-border-custom hover:border-gold hover:text-gold transition-colors"
            >
              Prejšnja
            </Link>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={p === 1 ? "/novice" : `/novice?stran=${p}`}
              className={`px-4 py-2 text-sm font-body border transition-colors ${
                p === page
                  ? "bg-navy text-white border-navy"
                  : "border-border-custom hover:border-gold hover:text-gold"
              }`}
            >
              {p}
            </Link>
          ))}

          {page < totalPages && (
            <Link
              href={`/novice?stran=${page + 1}`}
              className="px-4 py-2 text-sm font-body border border-border-custom hover:border-gold hover:text-gold transition-colors"
            >
              Naslednja
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  const imageUrl = post.featuredImage?.asset?.url
    ? builder
        .image(post.featuredImage)
        .width(600)
        .height(375)
        .quality(80)
        .auto("format")
        .url()
    : null;

  const publishedDate = new Date(post.publishedAt).toLocaleDateString("sl-SI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Link href={`/novice/${post.slug.current}`} className="group block">
      {imageUrl && (
        <div className="overflow-hidden mb-4 aspect-[16/10]">
          <Image
            src={imageUrl}
            alt={post.featuredImage?.alt || post.title}
            width={600}
            height={375}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}
      <time
        dateTime={post.publishedAt}
        className="text-xs text-muted-text font-body uppercase tracking-wide"
      >
        {publishedDate}
      </time>
      <h2 className="text-lg font-semibold mt-1 leading-snug group-hover:text-gold transition-colors">
        {post.title}
      </h2>
      {post.metaDescription && (
        <p className="text-sm text-body font-body mt-2 line-clamp-2">
          {post.metaDescription}
        </p>
      )}
    </Link>
  );
}
