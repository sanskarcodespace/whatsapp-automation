import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Wavelength — Business workspace",
  description: "Your independent business workspace.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
