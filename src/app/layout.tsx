import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kyiv 3 · Workforce & Recruitment",
  description: "Внутрішній HR-інструмент District Manager'a – JYSK Kyiv 3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

