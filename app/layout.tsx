import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Private Dance Lessons Directory — Find Elite Studios Near You",
    template: "%s | Private Dance Directory",
  },
  description:
    "Find the finest private dance instruction studios near you. Browse Fred Astaire, Arthur Murray, Dance With Me, and elite independent studios offering ballroom, Latin, tango, and wedding dance lessons.",
  keywords: ["private dance lessons", "ballroom dancing", "dance studios", "Arthur Murray", "Fred Astaire"],
  openGraph: {
    type: "website",
    siteName: "Private Dance Directory",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts loaded via link tag — works client-side even without build-time network access */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-white antialiased">
        {children}
      </body>
    </html>
  );
}
