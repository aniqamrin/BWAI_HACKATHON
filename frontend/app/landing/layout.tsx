import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EcosystemOS - Automate Ecosystem Relationships",
  description: "AI-powered ecosystem relationship automation platform for accelerators",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <style>{`
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
        `}</style>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
