import type { Metadata } from "next"
import "./globals.css"
export const metadata: Metadata = {
  title: "ANTIGRAVITY — AI Startup Intelligence Engine",
  description: "Evaluate your startup idea with 16 specialized AI agents. Get investor scores, market research, SWOT, competitor analysis, pitch deck, roadmap and funding readiness report.",
}

import { ClerkProvider, UserButton } from "@clerk/nextjs"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-body-md text-on-background selection:bg-primary-container selection:text-on-primary-container" suppressHydrationWarning>
        <ClerkProvider>
          <header className="fixed top-0 right-0 p-4 z-50">
            <UserButton />
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
