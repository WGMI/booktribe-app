import { pgTable, text, integer, timestamp, boolean, uuid, pgEnum } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  displayName: text("display_name"),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  location: text("location"),
  favoriteGenres: text("favorite_genres").array(),
  booksSwapped: integer("books_swapped").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const books = pgTable("books", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  genre: text("genre"),
  condition: text("condition").notNull().default("good"),
  description: text("description"),
  coverUrl: text("cover_url"),
  uploadedCoverUrl: text("uploaded_cover_url"),
  isbn: text("isbn"),
  openLibraryKey: text("open_library_key"),
  publishYear: integer("publish_year"),
  availableForSwap: boolean("available_for_swap").notNull().default(true),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookImages = pgTable("book_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookId: uuid("book_id").references(() => books.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const swapRequests = pgTable("swap_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  requesterId: text("requester_id").notNull(),
  ownerId: text("owner_id").notNull(),
  bookId: uuid("book_id").references(() => books.id).notNull(),
  offeredBookId: uuid("offered_book_id").references(() => books.id),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communities = pgTable("communities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  genre: text("genre"),
  location: text("location"),
  memberCount: integer("member_count").notNull().default(1),
  createdBy: text("created_by").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityMembers = pgTable("community_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  communityId: uuid("community_id").references(() => communities.id).notNull(),
  userId: text("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});
