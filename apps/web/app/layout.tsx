import "./globals.css";
import { ReactNode } from "react";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import { ThemeProvider } from "../components/ThemeProvider";
import { themeInitScript } from "../components/theme";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"]
});

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"]
});

export const metadata = {
  title: "LexNexus",
  description: "Plataforma jurídico-tech para estudo, revisão e prática orientada em Direito.",
  icons: {
    icon: "/brand/lexnexus-logo-official.png",
    shortcut: "/brand/lexnexus-logo-official.png",
    apple: "/brand/lexnexus-logo-official.png"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${plusJakartaSans.variable} ${sora.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
