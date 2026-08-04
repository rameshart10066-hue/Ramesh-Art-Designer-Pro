import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
      <body>
        <ErrorBoundary>
          <AppShell>{children}</AppShell>
        </ErrorBoundary>
      </body>
    </html>
  );
}
