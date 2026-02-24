import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Let's Entreprise Assessment System",
  description: 'Assessment dashboard for students and mentors',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
