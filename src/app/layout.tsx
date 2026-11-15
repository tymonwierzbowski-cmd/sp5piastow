import type { Metadata } from "next";
import "./podloga.css";

export const metadata: Metadata = {
  title: "Szkolna Podłoga SP5 Piastów — Porozrzucane Kartki Uczniów",
  description: "Zostaw swoją kartkę z pamiątką na szkolnej podłodze SP5 Piastów. Wpisz imię, nazwisko i klasę, zobacz co zostawili inni uczniowie.",
  keywords: ["sp5 piastow", "sp5 piastów", "szkoła podstawowa nr 5 piastów", "szkolna podłoga sp5", "sp5 piastow forum"],
  openGraph: {
    title: "Szkolna Podłoga SP5 Piastów — Porozrzucane Kartki Uczniów",
    description: "Zostaw swoją kartkę z pamiątką na szkolnej podłodze SP5 Piastów.",
    type: "website",
  }
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
