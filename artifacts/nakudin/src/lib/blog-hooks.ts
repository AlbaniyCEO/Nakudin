import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./auth-context";
import { isAdminEmail } from "./admin";
import {
  createBlogPost, deleteBlogPost, getBlogPostBySlug, listBlogPosts, updateBlogPost,
  type BlogStatus,
} from "./blog";

export const getBlogPostsQueryKey = (includeDrafts = false) => ["blogPosts", includeDrafts] as const;
export const getBlogPostSlugQueryKey = (slug: string) => ["blogPost", slug] as const;

function requireAdmin(email?: string | null) {
  if (!isAdminEmail(email)) throw new Error("Admin only.");
}

export function useListBlogPosts(opts?: { includeDrafts?: boolean; limit?: number }) {
  return useQuery({
    queryKey: getBlogPostsQueryKey(!!opts?.includeDrafts),
    queryFn: () => listBlogPosts(opts),
  });
}

export function useGetBlogPostBySlug(slug: string, opts?: { includeDraft?: boolean; enabled?: boolean }) {
  return useQuery({
    queryKey: getBlogPostSlugQueryKey(slug),
    queryFn: () => getBlogPostBySlug(slug, !!opts?.includeDraft),
    enabled: opts?.enabled ?? !!slug,
  });
}

export function useCreateBlogPost() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; body: string; excerpt?: string; images?: string[]; tags?: string[]; status?: BlogStatus }) => {
      requireAdmin(user?.email);
      return createBlogPost({ ...data, authorEmail: user?.email ?? null });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blogPosts"] }),
  });
}

export function useUpdateBlogPost() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { postId: string; data: Partial<{ title: string; body: string; excerpt: string; images: string[]; tags: string[]; status: BlogStatus }> }) => {
      requireAdmin(user?.email);
      return updateBlogPost(args.postId, args.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blogPosts"] }),
  });
}

export function useDeleteBlogPost() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      requireAdmin(user?.email);
      return deleteBlogPost(postId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blogPosts"] }),
  });
}
