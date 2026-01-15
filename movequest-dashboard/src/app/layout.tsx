import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "MoveQuest Testing Dashboard",
  description: "Standalone tester for ESP32 wearable",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main style={{ padding: "24px" }}>{children}</main>
      </body>
    </html>
  );
}
