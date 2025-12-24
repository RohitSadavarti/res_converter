"use client" // Add this line at the top

import dynamic from 'next/dynamic'

// Dynamically import the converter with SSR disabled
const PdfConverter = dynamic(
  () => import("@/components/pdf-converter").then((mod) => mod.PdfConverter),
  { ssr: false }
)

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground">PDF to Excel Converter</h1>
          <p className="text-muted-foreground mt-1">Convert Mumbai University B.Sc. result PDFs to Excel format</p>
        </div>
      </header>
      <PdfConverter />
    </main>
  )
}
