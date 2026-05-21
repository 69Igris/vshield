import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "#0f172a",
              color: "#ffffff",
              fontSize: "13px",
              borderRadius: "8px",
              padding: "12px 16px",
            },
            success: {
              iconTheme: { primary: "#22c55e", secondary: "#0f172a" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#0f172a" },
            },
          }}
        />
      </body>
    </html>
  );
}
