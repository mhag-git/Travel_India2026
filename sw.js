"use strict";

// Bei Inhaltsänderungen Version erhöhen, damit alle Dateien zusammen wechseln.
const VERSION = "india2026-v3";
const BASE = new URL("./", self.location.href);
const CACHE = `${VERSION}-${BASE.pathname}`;
const FILES = ["./", "./index.html", "./styles.css", "./data.js", "./app.js", "./icon.svg", "./manifest.webmanifest"];
const ALLOWED = new Set(FILES.map((file) => new URL(file, BASE).href));

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("india2026-") && key.endsWith(`-${BASE.pathname}`) && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const normalized = new URL(url.pathname, url.origin).href;
  // Nur feste öffentliche Dateien zwischenspeichern, keine importierten Inhalte.
  if (!ALLOWED.has(normalized)) return;
  event.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(normalized);
    return cached || fetch(event.request);
  }));
});
