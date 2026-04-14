import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { ClientShell } from "@/components/ClientShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Good Morning, Nikhil",
  description: "A personal brand calibration experience",
  metadataBase: new URL("https://good-morning-nikhil.vercel.app"),
  openGraph: {
    title: "Good Morning, Nikhil",
    description: "A personal brand calibration experience",
    url: "/",
    siteName: "Good Morning, Nikhil",
    type: "website",
    images: [
      {
        url: "/sets/morning-desk.webp",
        width: 1200,
        height: 630,
        alt: "A TV-styled morning desk set from Good Morning, Nikhil",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Good Morning, Nikhil",
    description: "A personal brand calibration experience",
    images: ["/sets/morning-desk.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <noscript>
          <div
            style={{
              display: "flex",
              minHeight: "100vh",
              alignItems: "center",
              justifyContent: "center",
              background: "#000",
              color: "#eab308",
              padding: "2rem",
              textAlign: "center",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                Good Morning, Nikhil
              </h1>
              <p style={{ marginTop: "1rem", color: "#a1a1aa" }}>
                This experience requires JavaScript. Please enable it and
                refresh.
              </p>
            </div>
          </div>
        </noscript>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
