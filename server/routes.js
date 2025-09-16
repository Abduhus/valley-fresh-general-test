"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const http_1 = require("http");
const storage_js_1 = require("./storage.js");
const schema_js_1 = require("../shared/schema.js");
const zod_1 = require("zod");
async function registerRoutes(app) {
    // Product routes
    app.get("/api/products", async (req, res) => {
        try {
            const { category, brand, search } = req.query;
            if (search && typeof search === 'string' && search.trim()) {
                const products = await storage_js_1.storage.searchProducts(search.trim());
                res.json(products);
            }
            else if (brand && typeof brand === 'string' && brand !== 'all') {
                const products = await storage_js_1.storage.getProductsByBrand(brand);
                res.json(products);
            }
            else if (category && typeof category === 'string' && category !== 'all') {
                const products = await storage_js_1.storage.getProductsByCategory(category);
                res.json(products);
            }
            else {
                const products = await storage_js_1.storage.getAllProducts();
                res.json(products);
            }
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch products" });
        }
    });
    app.get("/api/products/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const product = await storage_js_1.storage.getProduct(id);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
            res.json(product);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch product" });
        }
    });
    // Cart routes
    app.get("/api/cart/:sessionId", async (req, res) => {
        try {
            const { sessionId } = req.params;
            const cartItems = await storage_js_1.storage.getCartItems(sessionId);
            // Get product details for each cart item
            const cartWithProducts = await Promise.all(cartItems.map(async (item) => {
                const product = await storage_js_1.storage.getProduct(item.productId);
                return { ...item, product };
            }));
            res.json(cartWithProducts);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch cart items" });
        }
    });
    app.post("/api/cart", async (req, res) => {
        try {
            const validatedData = schema_js_1.insertCartItemSchema.parse(req.body);
            const cartItem = await storage_js_1.storage.addToCart(validatedData);
            res.json(cartItem);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ message: "Invalid request data", errors: error.issues });
            }
            res.status(500).json({ message: "Failed to add item to cart" });
        }
    });
    app.patch("/api/cart/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const { quantity } = req.body;
            if (typeof quantity !== 'number' || quantity <= 0) {
                return res.status(400).json({ message: "Quantity must be a positive number" });
            }
            const cartItem = await storage_js_1.storage.updateCartItem(id, quantity);
            if (!cartItem) {
                return res.status(404).json({ message: "Cart item not found" });
            }
            res.json(cartItem);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to update cart item" });
        }
    });
    app.delete("/api/cart/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const success = await storage_js_1.storage.removeFromCart(id);
            if (!success) {
                return res.status(404).json({ message: "Cart item not found" });
            }
            res.json({ message: "Item removed from cart" });
        }
        catch (error) {
            res.status(500).json({ message: "Failed to remove item from cart" });
        }
    });
    app.delete("/api/cart/session/:sessionId", async (req, res) => {
        try {
            const { sessionId } = req.params;
            await storage_js_1.storage.clearCart(sessionId);
            res.json({ message: "Cart cleared" });
        }
        catch (error) {
            res.status(500).json({ message: "Failed to clear cart" });
        }
    });
    const httpServer = (0, http_1.createServer)(app);
    return httpServer;
}
