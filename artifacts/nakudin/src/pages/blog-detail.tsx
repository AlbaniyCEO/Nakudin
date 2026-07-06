import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Clock3, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetBlogPostBySlug, useListBlogPosts } from "@/lib/blog-hooks";
import { estimateReadingMinutes } from "@/lib/blog";
import { openShareSheet, updateOgMeta } from "@/lib/share";
import { useState } from "react";
import { ShareDialog } from "@/components/ShareDialog";

export default function BlogDetailPage() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug ?? "";
  const { data: post, isLoading } = useGetBlogPostBySlug(slug, { enabled: !!slug });
  const { data: posts } = useListBlogPosts({ limit: 4 });
  const [shareOpen, setShareOpen] = useState(false);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (!post) return <div className="p-8 text-center text-muted-foreground">Blog post not found.</div>;

  updateOgMeta({ title: `${post.title} • Nakudin Blog`, description: post.excerpt, image: post.images?.[0] || "/brand/nakudin-og.png", url: window.location.href });

  const handleShare = async () => {
    try { await openShareSheet({ title: post.title, text: post.excerpt, url: window.location.href }); }
    catch { setShareOpen(true); }
  };

  return (
    <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="pb-24" data-testid="page-blog-detail">
      <div className="px-4 py-4 flex items-center justify-between">
        <Link href="/blog"><button className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2"><ArrowLeft size={18} /> Blog</button></Link>
        <Button size="icon" variant="ghost" onClick={handleShare}><Share2 size={17} /></Button>
      </div>

      <div className="px-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.map(tag => <span key={tag} className="rounded-full surface-2 border border-white/8 px-2.5 py-1 text-xs text-muted-foreground">{tag}</span>)}
        </div>
        <h1 className="text-3xl font-extrabold text-foreground leading-tight tracking-tight">{post.title}</h1>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{new Date(post.publishedAt ?? post.createdAt).toLocaleDateString("en-NG", { month: "long", day: "numeric", year: "numeric" })}</span>
          <span className="inline-flex items-center gap-1"><Clock3 size={12} />{estimateReadingMinutes(post.body)} min read</span>
        </div>
      </div>

      {post.images?.[0] && <img src={post.images[0]} alt={post.title} className="w-full max-h-[360px] object-cover mt-5" />}

      <div className="px-4 mt-6 prose prose-invert prose-sm max-w-none prose-p:text-muted-foreground prose-headings:text-foreground">
        {post.body.split(/\n{2,}/).map((paragraph, idx) => (
          <p key={idx} className="text-base leading-7 whitespace-pre-wrap text-foreground/85">{paragraph}</p>
        ))}
      </div>

      {(posts?.filter(p => p.id !== post.id).length ?? 0) > 0 && (
        <div className="px-4 mt-8">
          <h2 className="font-bold text-foreground mb-3">More from the blog</h2>
          <div className="grid gap-2">
            {posts?.filter(p => p.id !== post.id).slice(0, 3).map(p => (
              <Link key={p.id} href={`/blog/${p.slug}`}><div className="surface-1 rounded-xl p-3 text-sm font-semibold text-foreground">{p.title}</div></Link>
            ))}
          </div>
        </div>
      )}
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} title={post.title} url={window.location.href} />
    </motion.article>
  );
}
