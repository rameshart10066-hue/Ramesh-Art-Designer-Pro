import type { ReactNode } from "react";

export const metadata = {
  title: "Ramesh Art Designer Pro",
  description: "Business operations platform for the acrylic products business.",
};

/**
 * Root layout — wraps every route in the app router.
 * Keep this free of business logic; it's structural only.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
