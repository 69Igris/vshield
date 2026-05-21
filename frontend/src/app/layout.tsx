import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VShield — Background Verification Platform",
  description:
    "Submit candidate details, run Aadhaar & PAN verification, download professional reports.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-void text-white font-body antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "#0F1115",
              color: "#ffffff",
              fontSize: "13px",
              borderRadius: "12px",
              padding: "12px 16px",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 0 30px -10px rgba(247,147,26,0.25)",
            },
            success: {
              iconTheme: { primary: "#FFD600", secondary: "#0F1115" },
            },
            error: {
              iconTheme: { primary: "#EA580C", secondary: "#0F1115" },
            },
          }}
        />
      </body>
    </html>
  );
}
