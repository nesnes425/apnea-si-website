import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import imageUrlBuilder from "@sanity/image-url";
import { sanityClient } from "@/lib/sanity/client";
import { getBlogPost, getRelatedPosts } from "@/lib/sanity/queries";
import { PortableTextRenderer } from "@/components/blocks/PortableTextRenderer";
import type { BlogPost } from "@/lib/sanity/types";
import type { Metadata } from "next";

const builder = imageUrlBuilder(sanityClient);

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Novica ni najdena" };

  return {
    title: post.title,
    description: post.metaDescription || `${post.title} — Apnea Slovenija`,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(
    post._id,
    post.categories || [],
    3
  );

  const featuredImageUrl = post.featuredImage?.asset?.url
    ? builder
        .image(post.featuredImage)
        .width(1200)
        .quality(85)
        .auto("format")
        .url()
    : null;

  const publishedDate = new Date(post.publishedAt).toLocaleDateString("sl-SI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <article className="max-w-3xl mx-auto px-6 py-16">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-sm font-body text-muted-text">
            <li>
              <Link href="/" className="hover:text-gold transition-colors">
                Domov
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/novice" className="hover:text-gold transition-colors">
                Novice
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-navy truncate max-w-[300px]">{post.title}</li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <time
            dateTime={post.publishedAt}
            className="text-sm text-muted-text font-body uppercase tracking-wide"
          >
            {publishedDate}
          </time>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 leading-tight">
            {post.title}
          </h1>
          {post.categories && post.categories.length > 0 && (
            <div className="flex gap-2 mt-4">
              {post.categories.map((cat) => (
                <span
                  key={cat}
                  className="text-xs font-body uppercase tracking-wider bg-gold-pale text-navy px-3 py-1"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Featured image */}
        {featuredImageUrl && (
          <div className="mb-10 -mx-6 md:mx-0">
            <Image
              src={featuredImageUrl}
              alt={post.featuredImage?.alt || post.title}
              width={1200}
              height={675}
              className="w-full h-auto"
              priority
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        )}

        {/* Body */}
        <div className="text-body font-body">
          <PortableTextRenderer value={post.body} />
        </div>
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <RelatedPosts posts={relatedPosts} />
      )}
    </>
  );
}

function RelatedPosts({ posts }: { posts: BlogPost[] }) {
  return (
    <section className="border-t border-border-custom bg-surface">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-8">Preberite tudi</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <RelatedPostCard key={post._id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RelatedPostCard({ post }: { post: BlogPost }) {
  const imageUrl = post.featuredImage?.asset?.url
    ? builder
        .image(post.featuredImage)
        .width(400)
        .height(250)
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
    <Link
      href={`/novice/${post.slug.current}`}
      className="group block"
    >
      {imageUrl && (
        <div className="overflow-hidden mb-4">
          <Image
            src={imageUrl}
            alt={post.featuredImage?.alt || post.title}
            width={400}
            height={250}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}
      <time
        dateTime={post.publishedAt}
        className="text-xs text-muted-text font-body uppercase tracking-wide"
      >
        {publishedDate}
      </time>
      <h3 className="text-lg font-semibold mt-1 group-hover:text-gold transition-colors leading-snug">
        {post.title}
      </h3>
    </Link>
  );
}
