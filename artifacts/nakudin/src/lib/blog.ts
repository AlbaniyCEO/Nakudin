import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, query,
  serverTimestamp, Timestamp, updateDoc, where,
} from "firebase/firestore";
import { db } from "./firebase";

export type BlogStatus = "draft" | "published";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  images: string[];
  tags: string[];
  status: BlogStatus;
  authorEmail?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  publishedAt?: string | null;
}

function toDate(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (ts?.toDate) return ts.toDate().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  if (typeof ts === "string" || typeof ts === "number") {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  return new Date().toISOString();
}

function toBlogPost(id: string, data: any): BlogPost {
  return {
    id,
    slug: data.slug ?? id,
    title: data.title ?? "Untitled",
    excerpt: data.excerpt ?? "",
    body: data.body ?? "",
    images: Array.isArray(data.images) ? data.images : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    status: data.status ?? "draft",
    authorEmail: data.authorEmail ?? null,
    createdAt: toDate(data.createdAt),
    updatedAt: data.updatedAt ? toDate(data.updatedAt) : null,
    publishedAt: data.publishedAt ? toDate(data.publishedAt) : null,
  };
}

export function makeBlogSlug(title: string) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
  return base || `post-${Date.now()}`;
}

export function makeBlogExcerpt(body: string, max = 150) {
  const text = body.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

export function estimateReadingMinutes(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

async function uniqueSlug(title: string, currentId?: string) {
  const base = makeBlogSlug(title);
  let slug = base;
  let suffix = 2;
  while (true) {
    const existing = await getBlogPostBySlug(slug, true);
    if (!existing || existing.id === currentId) return slug;
    slug = `${base}-${suffix++}`;
  }
}

export async function listBlogPosts(opts?: { includeDrafts?: boolean; limit?: number }): Promise<BlogPost[]> {
  const q = query(collection(db, "blogPosts"), limit(Math.min(Math.max(opts?.limit ?? 30, 1), 60)));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => toBlogPost(d.id, d.data()))
    .filter(p => opts?.includeDrafts || p.status === "published")
    .sort((a, b) => new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime())
    .slice(0, opts?.limit ?? 30);
}

export async function getBlogPost(postId: string): Promise<BlogPost | null> {
  if (!postId) return null;
  const snap = await getDoc(doc(db, "blogPosts", postId));
  return snap.exists() ? toBlogPost(snap.id, snap.data()) : null;
}

export async function getBlogPostBySlug(slug: string, includeDraft = false): Promise<BlogPost | null> {
  if (!slug) return null;
  const snap = await getDocs(query(collection(db, "blogPosts"), where("slug", "==", slug), limit(1)));
  if (snap.empty) return null;
  const post = toBlogPost(snap.docs[0].id, snap.docs[0].data());
  if (!includeDraft && post.status !== "published") return null;
  return post;
}

export async function createBlogPost(data: {
  title: string;
  body: string;
  excerpt?: string;
  images?: string[];
  tags?: string[];
  status?: BlogStatus;
  authorEmail?: string | null;
}) {
  const status = data.status ?? "published";
  const slug = await uniqueSlug(data.title);
  const payload = {
    title: data.title.trim(),
    slug,
    body: data.body.trim(),
    excerpt: (data.excerpt?.trim() || makeBlogExcerpt(data.body)).trim(),
    images: (data.images ?? []).slice(0, 5),
    tags: data.tags ?? [],
    status,
    authorEmail: data.authorEmail ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    publishedAt: status === "published" ? serverTimestamp() : null,
  };
  const ref = await addDoc(collection(db, "blogPosts"), payload);
  return toBlogPost(ref.id, { ...payload, createdAt: Timestamp.now(), updatedAt: Timestamp.now(), publishedAt: status === "published" ? Timestamp.now() : null });
}

export async function updateBlogPost(postId: string, data: Partial<{
  title: string;
  body: string;
  excerpt: string;
  images: string[];
  tags: string[];
  status: BlogStatus;
}>) {
  const existing = await getBlogPost(postId);
  if (!existing) throw new Error("Blog post not found.");
  const nextStatus = data.status ?? existing.status;
  const update: Record<string, any> = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  if (data.title && data.title !== existing.title) update.slug = await uniqueSlug(data.title, postId);
  if (data.body && !data.excerpt) update.excerpt = makeBlogExcerpt(data.body);
  if (data.images) update.images = data.images.slice(0, 5);
  if (existing.status !== "published" && nextStatus === "published") update.publishedAt = serverTimestamp();
  await updateDoc(doc(db, "blogPosts", postId), update);
}

export async function deleteBlogPost(postId: string) {
  await deleteDoc(doc(db, "blogPosts", postId));
}
