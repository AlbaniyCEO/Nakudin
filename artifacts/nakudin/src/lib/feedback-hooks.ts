import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./auth-context";
import { useGetMyShop } from "./hooks";
import { isAdminEmail } from "./admin";
import {
  createFeedbackMessage, listFeedbackMessages, updateFeedbackMessage,
  type FeedbackCategory, type FeedbackStatus,
} from "./feedback";

export const getFeedbackMessagesQueryKey = (status?: string) => ["feedbackMessages", status ?? "all"] as const;

export function useCreateFeedbackMessage() {
  const { user } = useAuth();
  const { data: shop } = useGetMyShop({ query: { enabled: !!user } });
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { category: FeedbackCategory; subject: string; message: string; guestName?: string; guestEmail?: string }) => {
      const guestName = data.guestName?.trim() || null;
      const guestEmail = data.guestEmail?.trim() || null;
      return createFeedbackMessage({
        senderId: user?.uid ?? null,
        senderEmail: user?.email ?? guestEmail,
        senderName: shop?.businessName ?? user?.displayName ?? user?.email ?? guestName ?? "Visitor",
        senderType: isAdminEmail(user?.email) ? "admin" : shop ? "shop_owner" : "buyer",
        shopId: shop?.id ?? null,
        shopName: shop?.businessName ?? null,
        category: data.category,
        subject: data.subject,
        message: data.message,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedbackMessages"] }),
  });
}

export function useListFeedbackMessages(opts?: { status?: FeedbackStatus | "all"; limit?: number }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: getFeedbackMessagesQueryKey(opts?.status),
    queryFn: () => {
      if (!isAdminEmail(user?.email)) throw new Error("Admin only.");
      return listFeedbackMessages(opts);
    },
    enabled: isAdminEmail(user?.email),
  });
}

export function useUpdateFeedbackMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { messageId: string; data: Partial<{ status: FeedbackStatus; adminReply: string | null }> }) => {
      if (!isAdminEmail(user?.email)) throw new Error("Admin only.");
      return updateFeedbackMessage(args.messageId, args.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedbackMessages"] }),
  });
}
