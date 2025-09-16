import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Import vite config dynamically to avoid issues in production
  const { default: viteConfig } = await import("../vite.config.js");

  const { createServer: createViteServer, createLogger } = await import("vite");
  const viteLogger = createLogger();

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Use __dirname instead of import.meta.dirname for CommonJS compatibility
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production, files are built to dist/public
  // Use __dirname instead of import.meta.dirname for CommonJS compatibility
  const distPath = path.resolve(__dirname, "..", "public");

  // Also serve assets from the assets directory
  const assetsPath = path.resolve(__dirname, "..", "..", "assets");
  const attachedAssetsPath = path.resolve(__dirname, "..", "..", "attached_assets");

  app.use("/assets", express.static(assetsPath));
  app.use("/attached_assets", express.static(attachedAssetsPath));

  if (!fs.existsSync(distPath)) {
    // If we don't have a built version, serve from client directory
    const clientPath = path.resolve(__dirname, "..", "..", "client");
    app.use(express.static(clientPath));
    
    // fall through to index.html if the file doesn't exist
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, clientPath, "index.html"));
    });
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(__dirname, distPath, "index.html"));
  });
}