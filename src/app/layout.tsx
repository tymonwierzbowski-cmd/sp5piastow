import type { Metadata } from "next";
import "./podloga.css";

export const metadata: Metadata = {
  title: "SP5 Piastów — Szkolna Podłoga | Kartki i Pamiątki Uczniów SP5",
  description: "Zostaw swoją kartkę z pamiątką na szkolnej podłodze SP5 Piastów. Szkoła Podstawowa nr 5 Piastów (sp5 piastow, sp5piastow, sp5). Zobacz co zostawili inni uczniowie.",
  keywords: [
    "sp5 piastow",
    "sp5 piastów",
    "sp5",
    "szkoła podstawowa nr 5 piastów",
    "sp5piastow",
    "szkolna podłoga sp5"
  ],
  openGraph: {
    title: "SP5 Piastów — Szkolna Podłoga | Kartki i Pamiątki Uczniów SP5",
    description: "Zostaw swoją kartkę z pamiątką na szkolnej podłodze SP5 Piastów.",
    type: "website",
  },
  verification: {
    google: '9e3657fb1930d786',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
