import { UploadZone } from "@/components/UploadZone";
import { ResultsTable } from "@/components/ResultsTable";
import { useParser } from "@/hooks/use-parser";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, FileSpreadsheet, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { isParsing, progress, parsedData, handleFile, exportToExcel, reset } = useParser();

  return (
    <div className="min-h-screen bg-slate-50 relative selection:bg-indigo-100 overflow-x-hidden">
      {/* Abstract Background Decoration */}
      <div className="fixed top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-50 to-transparent -z-10" />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="fixed top-20 -left-20 w-72 h-72 bg-accent/5 rounded-full blur-3xl -z-10" />

      <main className="container max-w-5xl mx-auto px-4 py-16 sm:py-24">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-lg shadow-blue-900/5 mb-6">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 tracking-tight">
            Result Extractor
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Convert Mumbai University result PDFs into organized Excel sheets instantly.
            Run locally in your browser. No data upload.
          </p>
        </motion.div>

        {/* Parsing Section */}
        <div className="space-y-12">
          {parsedData.length === 0 ? (
            <UploadZone 
              onFileSelect={handleFile} 
              isProcessing={isParsing} 
              progress={progress} 
            />
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  onClick={exportToExcel}
                  className="glass-button h-14 px-8 rounded-xl bg-primary hover:bg-primary/90 text-lg shadow-lg shadow-primary/25 w-full sm:w-auto"
                >
                  <FileSpreadsheet className="mr-2 w-5 h-5" />
                  Download Excel
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={reset}
                  className="glass-button h-14 px-8 rounded-xl border-2 hover:bg-muted w-full sm:w-auto"
                >
                  <RefreshCw className="mr-2 w-5 h-5" />
                  Convert Another
                </Button>
              </div>

              {/* Data Preview */}
              <ResultsTable data={parsedData} />
              
              <p className="text-center text-sm text-muted-foreground font-mono">
                Showing {parsedData.length} records found in the document.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-slate-400 font-mono">
        <p>Built for efficiency. Runs 100% Client-Side.</p>
      </footer>
    </div>
  );
}
