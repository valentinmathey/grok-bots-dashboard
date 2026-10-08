import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
