import Dashboard from "@/components/Dashboard"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start py-12 px-4 bg-background text-foreground">
      <div className="max-w-4xl w-full mb-12 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Startup Accelerator AI
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground">
          Validate your idea, analyze the market, and get investor-ready with an Agentic AI team.
        </p>
      </div>
      
      <Dashboard />
    </main>
  )
}
