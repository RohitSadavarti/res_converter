"use client"
import { useState, useCallback } from "react"
import { Upload, FileSpreadsheet, Download, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { parseStudentResultsPDF, type StudentRecord } from "@/lib/pdf-parser"
import { exportToExcel } from "@/lib/excel-export"

export function PdfConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [subjectNames, setSubjectNames] = useState<string[]>([])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile?.type === "application/pdf") {
      setFile(selectedFile); setError(null); setStudents([]); setSubjectNames([]);
    }
  }, [])

  const processFile = async () => {
    if (!file) return
    setLoading(true); setProgress(20)
    try {
      const result = await parseStudentResultsPDF(file)
      setStudents(result.students); setSubjectNames(result.subjectNames)
      setProgress(100)
    } catch (err) {
      setError("Failed to extract data. Please ensure this is a valid MU PDF.")
    } finally { setLoading(false) }
  }

  const handleExport = () => {
    if (students.length > 0) exportToExcel(students, subjectNames, file?.name.replace(".pdf", "") || "results")
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Result to Excel Converter</CardTitle>
          <CardDescription>Extracts marks and subjects from Mumbai University PDFs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed p-10 text-center rounded-lg">
            <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" id="pdf-input" />
            <label htmlFor="pdf-input" className="cursor-pointer block">
              <FileSpreadsheet className="mx-auto mb-2" />
              {file ? file.name : "Click to select result PDF"}
            </label>
          </div>
          {file && <Button className="w-full" onClick={processFile} disabled={loading}>{loading ? "Processing..." : "Extract Data"}</Button>}
          {loading && <Progress value={progress} />}
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {students.length > 0 && <Button variant="outline" className="w-full" onClick={handleExport}><Download className="mr-2" /> Download Excel (.csv)</Button>}
        </CardContent>
      </Card>
    </div>
  )
}
