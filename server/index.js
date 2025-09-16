"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routes_js_1 = require("./routes.js");
const path_1 = __importDefault(require("path"));
const viteLogger = {
    info: console.log,
    warn: console.warn,
    error: console.error,
};
function log(message, source = "express") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
    console.log(`${formattedTime} [${source}] ${message}`);
}
const app = (0, express_1.default)();
app.set('env', process.env.NODE_ENV || 'development');
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
// Add CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});
// Health check endpoint for Railway and other monitoring services
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// Additional health check endpoint for Render
app.get('/render/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        platform: 'render'
    });
});
// Root health check endpoint for compatibility
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        message: 'ValleyPreview Perfume E-commerce Platform is running'
    });
});
// Serve static assets from the assets directory
app.use('/assets', express_1.default.static(path_1.default.join(process.cwd(), 'assets')));
app.use('/attached_assets', express_1.default.static(path_1.default.join(process.cwd(), 'attached_assets')));
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse = undefined;
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }
            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }
            log(logLine);
        }
    });
    next();
});
(async () => {
    const server = await (0, routes_js_1.registerRoutes)(app);
    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        console.error("Error caught in middleware:", err);
        res.status(status).json({ message });
    });
    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    const isDev = process.env.NODE_ENV?.trim() === "development";
    if (isDev) {
        const { setupVite } = await Promise.resolve().then(() => __importStar(require("./vite.js")));
        await setupVite(app, server);
    }
    else {
        const { serveStatic } = await Promise.resolve().then(() => __importStar(require("./vite.js")));
        serveStatic(app);
    }
    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    // Log that we're about to start listening
    console.log(`Attempting to start server on port ${port}`);
    server.listen({
        port,
        host: "0.0.0.0", // Changed from 127.0.0.1 to 0.0.0.0 for compatibility
    }, () => {
        log(`serving on port ${port}`);
        console.log(`Server successfully started on port ${port}`);
        console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    });
    // Handle server errors
    server.on('error', (error) => {
        console.error('Server failed to start:', error);
        process.exit(1);
    });
})();
