import type { Metadata } from "next"
import "./globals.css"
export const metadata: Metadata = {
  title: "Nexora — AI Startup Intelligence Engine",
  description: "Evaluate your startup idea with 16 specialized AI agents. Get investor scores, market research, SWOT, competitor analysis, pitch deck, roadmap and funding readiness report.",
}

import { ClerkProvider, UserButton } from "@clerk/nextjs"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-body-md text-on-background selection:bg-primary-container selection:text-on-primary-container" suppressHydrationWarning>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
