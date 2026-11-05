import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const display = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fredoka",
});

const body = Nunito({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "봄이콩이 | BomKong",
  description:
    "한국어 보고 같은 편 영어, 이어서 다음 한국어. 봄이콩이 시청 사이트 뼈대.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${display.variable} ${body.variable}`}>
        <div className="app-root">{children}</div>
      </body>
    </html>
  );
}
