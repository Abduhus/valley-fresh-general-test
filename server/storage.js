"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.MemStorage = void 0;
const crypto_1 = require("crypto");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Load products from the JSON file
let initialProducts = [];
try {
    const productsData = fs_1.default.readFileSync(path_1.default.join(process.cwd(), 'all-products.json'), 'utf-8');
    initialProducts = JSON.parse(productsData);
    // Convert stringified arrays back to arrays
    initialProducts = initialProducts.map(product => ({
        ...product,
        images: product.images ? JSON.parse(product.images) : null
    }));
}
catch (error) {
    console.error("Failed to load products from all-products.json:", error);
}
class MemStorage {
    constructor() {
        this.users = [];
        this.products = initialProducts; // Initialize with loaded products
        this.cartItems = [];
    }
    // User operations
    getUser(id) {
        return Promise.resolve(this.users.find((user) => user.id === id));
    }
    getUserByUsername(username) {
        return Promise.resolve(this.users.find((user) => user.username === username));
    }
    getUserByEmail(email) {
        return Promise.resolve(this.users.find((user) => user.email === email));
    }
    createUser(user) {
        const newUser = {
            id: (0, crypto_1.randomUUID)(),
            ...user
        };
        this.users.push(newUser);
        return Promise.resolve(newUser);
    }
    // Product operations
    getAllProducts() {
        return Promise.resolve(this.products);
    }
    getProduct(id) {
        return Promise.resolve(this.products.find((product) => product.id === id));
    }
    getProductsByCategory(category) {
        return Promise.resolve(this.products.filter((product) => product.category === category));
    }
    getProductsByBrand(brand) {
        return Promise.resolve(this.products.filter((product) => product.brand === brand));
    }
    searchProducts(query) {
        return Promise.resolve(this.products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase())));
    }
    createProduct(product) {
        const newProduct = {
            id: (0, crypto_1.randomUUID)(),
            images: null,
            inStock: true,
            topNotes: null,
            middleNotes: null,
            baseNotes: null,
            ...product
        };
        this.products.push(newProduct);
        return Promise.resolve(newProduct);
    }
    // Cart operations
    getCartItems(sessionId) {
        return Promise.resolve(this.cartItems.filter((cartItem) => cartItem.sessionId === sessionId));
    }
    addToCart(cartItem) {
        const newCartItem = {
            id: (0, crypto_1.randomUUID)(),
            quantity: 1,
            ...cartItem
        };
        this.cartItems.push(newCartItem);
        return Promise.resolve(newCartItem);
    }
    updateCartItem(id, quantity) {
        const cartItem = this.cartItems.find((cartItem) => cartItem.id === id);
        if (cartItem) {
            cartItem.quantity = quantity;
            return Promise.resolve(cartItem);
        }
        return Promise.resolve(undefined);
    }
    removeFromCart(id) {
        const index = this.cartItems.findIndex((cartItem) => cartItem.id === id);
        if (index !== -1) {
            this.cartItems.splice(index, 1);
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }
    clearCart(sessionId) {
        const initialLength = this.cartItems.length;
        this.cartItems = this.cartItems.filter((cartItem) => cartItem.sessionId !== sessionId);
        return Promise.resolve(this.cartItems.length !== initialLength);
    }
}
exports.MemStorage = MemStorage;
exports.storage = new MemStorage();
