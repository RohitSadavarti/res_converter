import { useCallback, useState } from "react";
import { Upload, FileText, Loader2, CheckCircle } from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  progress: string;
}

export function UploadZone({ onFileSelect, isProcessing, progress }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {isProcessing ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-3xl border-2 border-primary/20 bg-white/50 backdrop-blur-sm p-12 text-center shadow-2xl flex flex-col items-center justify-center h-64"
          >
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <div className="bg-primary/10 p-4 rounded-full relative">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            </div>
            <h3 className="mt-6 text-xl font-display font-bold text-primary">Processing PDF</h3>
            <p className="mt-2 text-muted-foreground font-mono text-sm">{progress}</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
              "relative group cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 p-12 text-center h-64 flex flex-col items-center justify-center",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.02] shadow-xl"
                : "border-border hover:border-primary/50 hover:bg-muted/30 bg-white/50 backdrop-blur-sm shadow-sm"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <input
              id="file-upload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleChange}
            />
            
            <div className={clsx(
              "p-4 rounded-full transition-colors duration-300 mb-4",
              isDragging ? "bg-primary text-white" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
            )}>
              <Upload className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-display font-bold text-foreground">
              Drop Result PDF Here
            </h3>
            <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
              or click to browse from your computer
            </p>
            
            <div className="mt-6 flex items-center gap-2 text-xs font-mono text-muted-foreground/60 bg-muted/50 px-3 py-1 rounded-full">
              <FileText className="w-3 h-3" />
              Supports standard Mumbai University Result PDFs
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
