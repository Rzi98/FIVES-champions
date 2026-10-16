import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIVES Robot Sim",
  description: "MA4012 tennis-ball robot simulator running the RobotC source",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
