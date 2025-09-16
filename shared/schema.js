"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertCartItemSchema = exports.insertProductSchema = exports.insertUserSchema = exports.cartItems = exports.products = exports.users = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    email: (0, pg_core_1.text)("email").notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
});
exports.products = (0, pg_core_1.pgTable)("products", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    price: (0, pg_core_1.decimal)("price", { precision: 10, scale: 2 }).notNull(),
    category: (0, pg_core_1.text)("category").notNull(), // 'women', 'men', 'unisex'
    brand: (0, pg_core_1.text)("brand").notNull(), // 'Rabdan', 'Signature Royale', 'Pure Essence', 'Coreterno', 'Valley Breezes'
    volume: (0, pg_core_1.text)("volume").notNull(), // '50ml', '75ml', '100ml'
    rating: (0, pg_core_1.decimal)("rating", { precision: 2, scale: 1 }).notNull(),
    imageUrl: (0, pg_core_1.text)("image_url").notNull(),
    moodImageUrl: (0, pg_core_1.text)("mood_image_url").notNull(),
    images: (0, pg_core_1.text)("images"), // JSON string array of additional product images
    inStock: (0, pg_core_1.boolean)("in_stock").notNull().default(true),
    // Fragrance notes fields
    topNotes: (0, pg_core_1.text)("top_notes"),
    middleNotes: (0, pg_core_1.text)("middle_notes"),
    baseNotes: (0, pg_core_1.text)("base_notes"),
});
exports.cartItems = (0, pg_core_1.pgTable)("cart_items", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    sessionId: (0, pg_core_1.text)("session_id").notNull(),
    productId: (0, pg_core_1.varchar)("product_id").notNull().references(() => exports.products.id),
    quantity: (0, pg_core_1.integer)("quantity").notNull().default(1),
});
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).omit({
    id: true,
});
exports.insertProductSchema = (0, drizzle_zod_1.createInsertSchema)(exports.products).omit({
    id: true,
});
exports.insertCartItemSchema = (0, drizzle_zod_1.createInsertSchema)(exports.cartItems).omit({
    id: true,
});
