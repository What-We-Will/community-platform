import type { Metadata } from "next";
import { Geist_Mono, Bebas_Neue, Montserrat } from "next/font/google";
import {
  getOrganizationJsonLd,
  ORGANIZATION_DESCRIPTION,
  ORGANIZATION_NAME,
} from "@/lib/organization-json-ld";
import { OG_IMAGE, serializeJsonLd } from "@/lib/seo";
import { getServerSiteUrl } from "@/lib/utils/get-site-url";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(`${getServerSiteUrl()}/`),
  title: {
    default: ORGANIZATION_NAME,
    template: `%s | ${ORGANIZATION_NAME}`,
  },
  description: ORGANIZATION_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: ORGANIZATION_NAME,
    title: ORGANIZATION_NAME,
    description: ORGANIZATION_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: ORGANIZATION_NAME,
    description: ORGANIZATION_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = getOrganizationJsonLd();

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(organizationJsonLd),
          }}
        />
      </head>
      <body
        className={`${geistMono.variable} ${bebasNeue.variable} ${montserrat.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
