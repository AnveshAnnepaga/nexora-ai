import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Startup Idea Validation Platform",
  description: "AI-powered Startup Accelerator Platform to evaluate ideas and founders.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning prevents hydration mismatch errors caused by
    // browser extensions (like IDE tools) that inject extra classNames into the DOM
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
          {children}
        </main>
      </body>
    </html>
  )
}
