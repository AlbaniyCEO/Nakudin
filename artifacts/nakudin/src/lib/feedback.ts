import {
  addDoc, collection, doc, getDocs, limit, query, serverTimestamp,
  Timestamp, updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type FeedbackStatus = "open" | "reviewed" | "replied";
export type FeedbackCategory = "feedback" | "support" | "bug" | "verification" | "billing" | "other";
export type FeedbackSenderType = "buyer" | "shop_owner" | "admin";

export interface FeedbackMessage {
  id: string;
  senderId: string | null;
  senderEmail: string | null;
  senderName: string;
  senderType: FeedbackSenderType;
  shopId?: string | null;
  shopName?: string | null;
  category: FeedbackCategory;
  subject: string;
  message: string;
  status: FeedbackStatus;
  adminReply?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  repliedAt?: string | null;
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

function toFeedbackMessage(id: string, data: any): FeedbackMessage {
  return {
    id,
    senderId: data.senderId ?? null,
    senderEmail: data.senderEmail ?? null,
    senderName: data.senderName ?? "User",
    senderType: data.senderType ?? "buyer",
    shopId: data.shopId ?? null,
    shopName: data.shopName ?? null,
    category: data.category ?? "feedback",
    subject: data.subject ?? "Feedback",
    message: data.message ?? "",
    status: data.status ?? "open",
    adminReply: data.adminReply ?? null,
    createdAt: toDate(data.createdAt),
    updatedAt: data.updatedAt ? toDate(data.updatedAt) : null,
    repliedAt: data.repliedAt ? toDate(data.repliedAt) : null,
  };
}

export async function createFeedbackMessage(data: {
  senderId: string | null;
  senderEmail: string | null;
  senderName?: string | null;
  senderType: FeedbackSenderType;
  shopId?: string | null;
  shopName?: string | null;
  category: FeedbackCategory;
  subject: string;
  message: string;
}) {
  const payload = {
    senderId: data.senderId,
    senderEmail: data.senderEmail?.trim().slice(0, 160) || null,
    senderName: (data.senderName || data.shopName || data.senderEmail || "Visitor").trim().slice(0, 120),
    senderType: data.senderType,
    shopId: data.shopId ?? null,
    shopName: data.shopName ?? null,
    category: data.category,
    subject: data.subject.trim().slice(0, 140),
    message: data.message.trim().slice(0, 5000),
    status: "open" as FeedbackStatus,
    adminReply: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, "feedbackMessages"), payload);
  return toFeedbackMessage(ref.id, { ...payload, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
}

export async function listFeedbackMessages(opts?: { limit?: number; status?: FeedbackStatus | "all" }) {
  const q = query(collection(db, "feedbackMessages"), limit(Math.min(Math.max(opts?.limit ?? 60, 1), 100)));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => toFeedbackMessage(d.id, d.data()))
    .filter(m => !opts?.status || opts.status === "all" || m.status === opts.status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, opts?.limit ?? 60);
}

export async function updateFeedbackMessage(messageId: string, data: Partial<{ status: FeedbackStatus; adminReply: string | null }>) {
  const update: Record<string, any> = { ...data, updatedAt: serverTimestamp() };
  if (data.adminReply !== undefined && data.adminReply) {
    update.status = "replied";
    update.repliedAt = serverTimestamp();
  }
  await updateDoc(doc(db, "feedbackMessages", messageId), update);
}
