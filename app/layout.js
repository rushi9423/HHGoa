import { Anton, Space_Mono, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  weight: ["400", "700"],
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  display: "swap",
});

export const metadata = {
  title: "HH Goa 2026 — Frame Generator & Builder ID Card",
  description: "Generate your HH Goa 2026 PFP frame or Builder ID card. Upload your photo, choose a style, and share to X in seconds. #FrameInGoa",
  keywords: ["Hacker House", "Goa", "2026", "HH Goa", "PFP", "Frame Generator", "Builder ID", "Hackathon"],
  openGraph: {
    title: "HH Goa 2026 — Frame Generator",
    description: "Generate your HH Goa 2026 PFP frame or Builder ID card. #FrameInGoa",
    type: "website",
    siteName: "HH Goa 2026",
  },
  twitter: {
    card: "summary_large_image",
    title: "HH Goa 2026 — Frame Generator",
    description: "Generate your HH Goa 2026 PFP frame or Builder ID card. #FrameInGoa",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d3b2e",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${spaceMono.variable} ${notoDevanagari.variable} h-full`}
    >
      <head>
        <meta name="theme-color" content="#0d3b2e" />
        <link rel="icon" href="/favicon.ico" />
        {/* Load fonts via CDN for Canvas API access (next/font handles CSS but canvas needs font-family name) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Mono:wght@400;700&family=Noto+Sans+Devanagari:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
