import fs from "fs";
import { Browser, chromium } from "playwright";

type GeneratePdfFromHtmlOptions = {
  footerTemplate?: string;
  format?: "A4";
  headerTemplate?: string;
  margin?: {
    bottom?: string;
    left?: string;
    right?: string;
    top?: string;
  };
};

let browserPromise: Promise<Browser> | null = null;

const getChromiumExecutablePath = () => {
  const configuredPath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

  if (configuredPath && fs.existsSync(configuredPath)) {
    return configuredPath;
  }

  const knownPaths = [
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];

  return knownPaths.find((candidate) => fs.existsSync(candidate));
};

const getBrowser = () => {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      args: process.platform === "linux" ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
      executablePath: getChromiumExecutablePath(),
      headless: true,
    });
  }

  return browserPromise;
};

const closeBrowser = async () => {
  if (!browserPromise) {
    return;
  }

  const browser = await browserPromise;
  await browser.close();
  browserPromise = null;
};

process.once("exit", () => {
  void closeBrowser();
});

process.once("SIGINT", () => {
  void closeBrowser().finally(() => process.exit(0));
});

process.once("SIGTERM", () => {
  void closeBrowser().finally(() => process.exit(0));
});

export const generatePdfFromHtml = async (html: string, options?: GeneratePdfFromHtmlOptions) => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });

    return await page.pdf({
      displayHeaderFooter: true,
      headerTemplate: `...`,
      footerTemplate: options?.footerTemplate ?? "<div></div>",
      format: options?.format ?? "A4",
      margin: {
        top: options?.margin?.top ?? "8mm",
        right: options?.margin?.right ?? "14mm",
        bottom: options?.margin?.bottom ?? "4mm",
        left: options?.margin?.left ?? "14mm",
      },
      printBackground: true,
    });
  } finally {
    await page.close();
  }
};
