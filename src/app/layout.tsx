import type { Metadata, Viewport } from "next";
import { Nunito, Poppins, Quicksand } from "next/font/google";
import { Providers } from "@/components/providers";
import { themeScript } from "@/components/providers/ThemeProvider";
import "./globals.css";

/**
 * Nunito - Primary font (rounded, friendly)
 */
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

/**
 * Poppins - Alternative font
 */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: ["300", "400", "500", "600", "700"],
});

/**
 * Quicksand - Alternative font
 */
const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Classey — University Life Tracker",
    template: "%s | Classey",
  },
  description:
    "A comprehensive university life tracker for managing semesters, classes, attendance, exams, tasks, and personal events.",
  keywords: [
    "university",
    "college",
    "tracker",
    "attendance",
    "semester",
    "CGPA",
    "student",
    "timetable",
  ],
  authors: [{ name: "Melvin" }],
  creator: "Melvin",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "icon", url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0c" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${poppins.variable} ${quicksand.variable} dark`}
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Prevent FOUC by setting theme before React hydrates */}
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
          suppressHydrationWarning
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
