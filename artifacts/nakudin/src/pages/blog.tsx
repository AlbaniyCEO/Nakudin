import { Link } from "wouter";
import { motion } from "framer-motion";
import { CalendarDays, Clock3, Loader2, Newspaper } from "lucide-react";
import { useListBlogPosts } from "@/lib/blog-hooks";
import { estimateReadingMinutes } from "@/lib/blog";

export default function BlogPage() {
  const { data: posts, isLoading } = useListBlogPosts({ limit: 40 });
  const featured = posts?.[0];
  const rest = posts?.slice(1) ?? [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="px-4 py-4 pb-24" data-testid="page-blog">
      <div className="mb-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 text-primary px-3 py-1 text-xs font-semibold mb-3">
          <Newspaper size={14} /> Nakudin Blog
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Selling tips, marketplace updates, and growth guides</h1>
        <p className="text-sm text-muted-foreground mt-2">Simple, practical posts from the Nakudin team for shop owners and buyers.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : !posts?.length ? (
        <div className="surface-1 rounded-2xl p-8 text-center text-muted-foreground">
          <Newspaper size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No blog posts yet. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {featured && (
            <Link href={`/blog/${featured.slug}`}>
              <article className="surface-1 interactive-card rounded-[1.75rem] overflow-hidden border border-primary/15">
                <div className="relative h-52 surface-2 overflow-hidden">
                  {featured.images?.[0] ? (
                    <img src={featured.images[0]} alt={featured.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 via-amber-500/10 to-violet-500/10" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute left-4 bottom-4 rounded-full bg-primary text-black text-xs font-bold px-3 py-1">Featured</span>
                </div>
                <div className="p-5">
                  <h2 className="text-xl font-extrabold text-foreground leading-tight">{featured.title}</h2>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{featured.excerpt}</p>
                  <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{new Date(featured.publishedAt ?? featured.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span className="inline-flex items-center gap-1"><Clock3 size={12} />{estimateReadingMinutes(featured.body)} min read</span>
                  </div>
                </div>
              </article>
            </Link>
          )}

          <div className="grid gap-3">
            {rest.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <article className="surface-1 interactive-card rounded-2xl p-3 flex gap-3">
                  <div className="w-24 h-24 rounded-xl surface-2 overflow-hidden flex-shrink-0">
                    {post.images?.[0] ? <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-primary/20 to-amber-500/10" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-foreground line-clamp-2">{post.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                      <span>{new Date(post.publishedAt ?? post.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}</span>
                      <span>·</span>
                      <span>{estimateReadingMinutes(post.body)} min read</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
