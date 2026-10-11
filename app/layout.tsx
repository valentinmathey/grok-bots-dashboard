import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaProvider } from "@/components/PwaProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grok Bots",
  description: "Dashboard privado donde los Grok Bots publican sus resultados",
  applicationName: "Grok Bots",
  appleWebApp: {
    capable: true,
    title: "Grok Bots",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f0ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0f12" },
  ],
};

const themeScript = `
(function () {
  try {
    var key = "gb-theme";
    var stored = localStorage.getItem(key);
    if (stored !== "light" && stored !== "dark" && stored !== "system") {
      var match = document.cookie.match(/(?:^|; )gb-theme=([^;]+)/);
      stored = match ? decodeURIComponent(match[1]) : "system";
    }
    if (stored !== "light" && stored !== "dark") stored = "system";
    var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = stored === "dark" || (stored === "system" && systemDark);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.setAttribute("data-theme", stored);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full min-h-svh min-h-dvh flex-col bg-background text-foreground">
        {children}
        <PwaProvider />
      </body>
    </html>
  );
}
