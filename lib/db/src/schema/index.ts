import { pgTable, text, integer, real, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscriptionStatusEnum = pgEnum("subscription_status", ["trial", "active", "grace", "locked"]);
export const productStatusEnum = pgEnum("product_status", ["active", "hidden", "deleted"]);
export const reportStatusEnum = pgEnum("report_status", ["open", "reviewed", "dismissed"]);
export const reportTargetEnum = pgEnum("report_target_type", ["shop", "product"]);

export const shopsTable = pgTable("shops", {
  id: text("id").primaryKey(),
  businessName: text("business_name").notNull(),
  businessNameLower: text("business_name_lower").notNull(),
  bio: text("bio"),
  category: text("category").notNull(),
  logoUrl: text("logo_url"),
  coverUrl: text("cover_url"),
  whatsappNumber: text("whatsapp_number"),
  locationCity: text("location_city"),
  locationState: text("location_state"),
  locationLat: real("location_lat"),
  locationLng: real("location_lng"),
  verified: boolean("verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  followerCount: integer("follower_count").notNull().default(0),
  followingCount: integer("following_count").notNull().default(0),
  totalViews: integer("total_views").notNull().default(0),
  totalLikes: integer("total_likes").notNull().default(0),
  totalWhatsappClicks: integer("total_whatsapp_clicks").notNull().default(0),
  avgRating: real("avg_rating"),
  reviewCount: integer("review_count").notNull().default(0),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").notNull().default("trial"),
  trialEndsAt: timestamp("trial_ends_at"),
  nextBillingDate: timestamp("next_billing_date"),
  suspended: boolean("suspended").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shopsTable.id),
  title: text("title").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  images: text("images").array().notNull().default([]),
  category: text("category"),
  locationCity: text("location_city"),
  locationState: text("location_state"),
  locationLat: real("location_lat"),
  locationLng: real("location_lng"),
  likeCount: integer("like_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  whatsappClickCount: integer("whatsapp_click_count").notNull().default(0),
  trendScore: real("trend_score").notNull().default(0),
  stockQuantity: integer("stock_quantity").notNull().default(1),
  status: productStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stockWatchersTable = pgTable("stock_watchers", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const likesTable = pgTable("likes", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => productsTable.id),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const followsTable = pgTable("follows", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shopsTable.id),
  followerId: text("follower_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const commentsTable = pgTable("comments", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => productsTable.id),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  authorLogoUrl: text("author_logo_url"),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviewsTable = pgTable("reviews", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shopsTable.id),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  authorLogoUrl: text("author_logo_url"),
  rating: integer("rating").notNull(),
  text: text("text"),
  ownerReply: text("owner_reply"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const whatsappClicksTable = pgTable("whatsapp_clicks", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull(),
  productId: text("product_id").notNull(),
  userId: text("user_id"),
  deviceId: text("device_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reportsTable = pgTable("reports", {
  id: text("id").primaryKey(),
  targetType: reportTargetEnum("target_type").notNull(),
  targetId: text("target_id").notNull(),
  reporterUid: text("reporter_uid"),
  reason: text("reason").notNull(),
  details: text("details"),
  status: reportStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShopSchema = createInsertSchema(shopsTable).omit({ createdAt: true });
export const insertProductSchema = createInsertSchema(productsTable).omit({ createdAt: true });
export const insertLikeSchema = createInsertSchema(likesTable).omit({ createdAt: true });
export const insertFollowSchema = createInsertSchema(followsTable).omit({ createdAt: true });
export const insertCommentSchema = createInsertSchema(commentsTable).omit({ createdAt: true });
export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ createdAt: true });
export const insertReportSchema = createInsertSchema(reportsTable).omit({ createdAt: true });

export type Shop = typeof shopsTable.$inferSelect;
export type InsertShop = z.infer<typeof insertShopSchema>;
export type Product = typeof productsTable.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Like = typeof likesTable.$inferSelect;
export type Follow = typeof followsTable.$inferSelect;
export type Comment = typeof commentsTable.$inferSelect;
export type Review = typeof reviewsTable.$inferSelect;
export type Report = typeof reportsTable.$inferSelect;
