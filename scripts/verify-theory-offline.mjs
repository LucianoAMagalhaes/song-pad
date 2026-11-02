import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { chromium } from "playwright";

// Exercise the exported app and real service worker, never the development server.
const root = resolve("out");
assert.ok(existsSync(resolve(root, "theory.html")), "Run npm run build first");
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
assert.ok(apiKey, "Set NEXT_PUBLIC_FIREBASE_API_KEY to the value used in the build");
const uid = "theory-offline-verification";
const artifactDir = resolve(process.env.OFFLINE_ARTIFACT_DIR ?? "/tmp/songpad-theory-offline");
const contentTypes = {
  ".html": "text/html",
  ".txt": "text/plain",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".png": "image/png",
};

// Model Firebase Hosting clean URLs and the existing dynamic route rewrites.
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let file = resolve(root, `.${pathname === "/" ? "/index" : pathname}`);
    assert.ok(file.startsWith(root + sep));
    if (!extname(file)) file += ".html";
    if (!existsSync(file)) {
      const match = pathname.match(/^\/(songs|setlists)\/[^/]+(\/edit)?$/);
      if (match) file = resolve(root, `${match[1]}/_${match[2] ?? ""}.html`);
    }
    response.setHeader("Content-Type", contentTypes[extname(file)] ?? "application/octet-stream");
    // HTTP cache must not conceal a missing service-worker response.
    response.setHeader("Cache-Control", "no-store");
    response.end(await readFile(file));
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

/** Seed only Firebase's external persistence boundary; keep AuthProvider/Guard real. */
async function seedSession(page, origin) {
  await page.goto(`${origin}/icons/icon-192.png`);
  await page.evaluate(
    async ({ apiKey, uid }) => {
      localStorage.setItem(`songpad:migrated:${uid}`, "true");
      const request = indexedDB.open("firebaseLocalStorageDb", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("firebaseLocalStorage", { keyPath: "fbase_key" });
      const db = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const transaction = db.transaction("firebaseLocalStorage", "readwrite");
      transaction.objectStore("firebaseLocalStorage").put({
        fbase_key: `firebase:authUser:${apiKey}:[DEFAULT]`,
        value: {
          uid,
          email: "offline@example.test",
          emailVerified: true,
          isAnonymous: false,
          providerData: [],
          stsTokenManager: {
            refreshToken: "synthetic-refresh-token",
            accessToken: "synthetic-access-token",
            expirationTime: Date.now() + 86_400_000,
          },
          apiKey,
          appName: "[DEFAULT]",
          createdAt: "1700000000000",
          lastLoginAt: "1700000000000",
        },
      });
      await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
    },
    { apiKey, uid },
  );
}

async function expectText(locator, text) {
  await locator.filter({ hasText: text }).waitFor();
}

async function visitLibraryAndReturn(page, name) {
  await page.getByRole("navigation", { name: "Biblioteca" }).getByRole("link", { name }).click();
  await page.getByRole("link", { name: "Teoria", exact: true }).click();
  await page.getByRole("grid").waitFor();
}

async function assertLayout(page) {
  assert.equal(await page.getByRole("grid").getByRole("columnheader").count(), 26);
  assert.equal(await page.getByRole("grid").getByRole("rowheader").count(), 6);
  assert.equal(await page.getByRole("grid").getByRole("button").count(), 150);
  const layout = await page.evaluate(() => {
    const table = document.querySelector('[role="grid"]');
    return {
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      tableWidth: table.scrollWidth,
      scrollWidth: table.parentElement.clientWidth,
    };
  });
  assert.ok(layout.documentWidth <= layout.width, "Only the fretboard should scroll horizontally");
  if (layout.width < 1000) assert.ok(layout.tableWidth > layout.scrollWidth);
  await expectText(page.locator("main"), "◎ Posição seleccionada");
}

async function exploreOffline(page, touch) {
  const activate = (locator) => (touch ? locator.tap() : locator.click());
  const details = page.getByRole("region", { name: "Posição seleccionada", exact: true });
  await activate(page.getByRole("button", { name: "Notas", exact: true }));
  await page.getByLabel("Nota de referência", { exact: true }).selectOption("A");
  await activate(page.getByRole("button", { name: /^A2, 6\.ª corda, casa 5,/ }));
  await expectText(details, "A2");
  await expectText(details, "5.ª corda · casa 0 (solta)");
  await page.reload();
  assert.equal(await page.getByLabel("Nota de referência", { exact: true }).inputValue(), "A");
  await page.getByRole("button", { name: /^C4, 2\.ª corda, casa 1(?:,|$)/ }).waitFor();

  await activate(page.getByRole("button", { name: "Intervalos", exact: true }));
  await page.getByLabel("Nota de referência", { exact: true }).selectOption("C");
  await activate(page.getByRole("button", { name: /^G4, 1\.ª corda, casa 3,/ }));
  await expectText(details, "G: Quinta justa de C · 7 semitons na relação.");
  await page.getByLabel("Leitura", { exact: true }).selectOption("positions");
  const comparison = page.getByRole("region", { name: "Comparação entre posições" });
  await expectText(comparison, "7 semitons · Ascendente");
  await activate(page.getByRole("button", { name: /^G3, 3\.ª corda, casa 0,/ }));
  await expectText(comparison, "5 semitons · Descendente");
  await activate(page.getByRole("button", { name: /^E2, 6\.ª corda, casa 0,/ }));
  await expectText(comparison, "A distância ultrapassa uma oitava.");
  await page.reload();
  await page.getByRole("button", { name: "Intervalos", exact: true, pressed: true }).waitFor();
  assert.equal(await page.getByLabel("Leitura", { exact: true }).inputValue(), "relative");

  await activate(page.getByRole("button", { name: "Escalas", exact: true }));
  await page.getByLabel("Tónica", { exact: true }).selectOption("Db");
  await page.getByLabel("Família", { exact: true }).selectOption("minor-pentatonic");
  await page.getByLabel("Leitura", { exact: true }).selectOption("degrees");
  await activate(page.getByRole("button", { name: /^Ab3, 3\.ª corda, casa 1,/ }));
  await expectText(details, "Quinta justa · 7 semitons");
  await page.reload();
  await page.getByRole("button", { name: "Escalas", exact: true, pressed: true }).waitFor();
  assert.equal(await page.getByLabel("Tónica", { exact: true }).inputValue(), "Db");
  assert.equal(await page.getByLabel("Família", { exact: true }).inputValue(), "minor-pentatonic");
  assert.equal(await page.getByLabel("Leitura", { exact: true }).inputValue(), "degrees");
  await activate(page.getByRole("button", { name: /^Ab3, 3\.ª corda, casa 1,/ }));
  assert.equal(await page.locator('button[data-string="3"][data-fret="1"]').innerText(), "5");
  await page.getByLabel("Leitura", { exact: true }).selectOption("notes");
  await expectText(details, "Ab3");
  await page.getByLabel("Tónica", { exact: true }).selectOption("C#");
  await page.getByLabel("Família", { exact: true }).selectOption("major");
  await activate(page.getByRole("button", { name: /^E#4, 1\.ª corda, casa 1,/ }));
  await expectText(details, "E#4");
  await expectText(details, "Terça maior · 4 semitons");
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowDown");
  assert.equal(await page.locator(":focus").getAttribute("data-fret"), "24");
  assert.equal(await page.locator(":focus").getAttribute("data-string"), "2");
  await assertLayout(page);
}

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  });
  const anonymous = await browser.newContext();
  const anonymousPage = await anonymous.newPage();
  await anonymousPage.goto(`${origin}/theory`);
  await anonymousPage.waitForURL("**/login");
  await anonymous.close();

  for (const device of [
    { name: "desktop", viewport: { width: 1440, height: 1000 }, touch: false },
    { name: "tablet", viewport: { width: 820, height: 1180 }, touch: true },
    { name: "mobile", viewport: { width: 390, height: 844 }, touch: true },
  ]) {
    const context = await browser.newContext({ viewport: device.viewport, hasTouch: device.touch });
    // A synthetic persisted Firebase session avoids Google credentials and production data.
    await context.route("https://identitytoolkit.googleapis.com/**", (route) =>
      route.fulfill({
        json: {
          users: [{ localId: uid, email: "offline@example.test", emailVerified: true }],
        },
      }),
    );
    await context.route("https://firestore.googleapis.com/**", (route) => route.abort());
    const page = await context.newPage();
    const errors = [];
    const cloudRequests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.url().includes("firestore.googleapis.com")) cloudRequests.push(request.url());
    });
    await seedSession(page, origin);
    await page.goto(`${origin}/theory`);
    await page.getByRole("grid").waitFor();
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.waitForFunction(async () => !!(await caches.match("/theory")));
    assert.equal(cloudRequests.length, 0, "Teoria must not request Firestore");
    await context.setOffline(true);
    // First revisit: no second online load may accidentally populate a different cache.
    const response = await page.reload({ waitUntil: "domcontentloaded" });
    assert.ok(response.fromServiceWorker(), "Reload must be served by the service worker");
    await page.getByRole("grid").waitFor();
    assert.equal(await page.evaluate(() => navigator.onLine), false);
    await exploreOffline(page, device.touch);
    assert.equal(cloudRequests.length, 0, "Offline exploration must not use Firestore");
    await page.screenshot({ path: resolve(artifactDir, `${device.name}.png`), fullPage: true });

    // Check a new document in the same persisted session, with the network still disabled.
    const reopened = await context.newPage();
    const reopenedResponse = await reopened.goto(`${origin}/theory`);
    assert.ok(reopenedResponse.fromServiceWorker());
    await reopened.getByRole("grid").waitFor();
    assert.equal(await reopened.getByLabel("Tónica", { exact: true }).inputValue(), "C#");
    await reopened.close();

    // Warm library routes online, then exercise their real links without a network.
    // Keep this after the first offline reload so it cannot hide the regression.
    // reloadOnOnline refreshes the document; finish it before clicking links.
    await Promise.all([page.waitForEvent("load"), context.setOffline(false)]);
    for (const name of ["← Músicas", "Setlists"]) {
      await visitLibraryAndReturn(page, name);
    }
    await page.waitForFunction(async () => {
      const documents = await caches.open("pages");
      return !!(await documents.match("/songs")) && !!(await documents.match("/setlists"));
    });
    await context.setOffline(true);
    for (const name of ["← Músicas", "Setlists"]) {
      await visitLibraryAndReturn(page, name);
      assert.equal(await page.getByLabel("Tónica", { exact: true }).inputValue(), "C#");
      const response = await page.reload();
      assert.ok(response.fromServiceWorker());
      await page.getByRole("grid").waitFor();
    }
    assert.deepEqual(errors, []);
    console.log(
      `${device.name}: offline reload, three modes, preferences, new tab, library links, layout, touch/keyboard passed`,
    );
    await context.close();
  }
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
