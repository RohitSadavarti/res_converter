"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, FileSpreadsheet, Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { DataPreview } from "@/components/data-preview"
import { parseStudentResultsPDF, type StudentRecord } from "@/lib/pdf-parser"
import { exportToExcel } from "@/lib/excel-export"

export function PdfConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [rawText, setRawText] = useState<string>("")

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
      setError(null)
      setStudents([])
      setRawText("")
    } else {
      setError("Please select a valid PDF file")
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile)
      setError(null)
      setStudents([])
      setRawText("")
    } else {
      setError("Please drop a valid PDF file")
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const processFile = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setProgress(10)

    try {
      setProgress(30)
      const result = await parseStudentResultsPDF(file)
      setProgress(80)

      if (result.students.length === 0) {
        setError("No student records found in the PDF. Make sure it's a valid Mumbai University result PDF.")
      } else {
        setStudents(result.students)
        setRawText(result.rawText)
        console.log("[v0] Parsed students:", result.students.length)
      }
      setProgress(100)
    } catch (err) {
      console.error("[v0] Error parsing PDF:", err)
      setError(err instanceof Error ? err.message : "Failed to parse PDF")
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (students.length === 0) return

    try {
      exportToExcel(students, file?.name.replace(".pdf", "") || "result_parsed")
    } catch (err) {
      console.error("[v0] Export error:", err)
      setError("Failed to export to Excel")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload PDF
            </CardTitle>
            <CardDescription>Upload a Mumbai University B.Sc. result PDF to extract student data</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            >
              <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" id="pdf-upload" />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-1">{file ? file.name : "Drop your PDF here or click to browse"}</p>
                <p className="text-sm text-muted-foreground">Supports Mumbai University B.Sc. result PDFs</p>
              </label>
            </div>

            {file && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{file.name}</span>
                  <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <Button onClick={processFile} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Extract Data"
                  )}
                </Button>
              </div>
            )}

            {loading && (
              <div className="mt-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">Extracting student records...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Section */}
        {students.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Extracted Data</CardTitle>
                    <CardDescription>Found {students.length} student records</CardDescription>
                  </div>
                  <Button onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DataPreview students={students} />
              </CardContent>
            </Card>

            {/* Raw Text Debug */}
            <Card>
              <CardHeader>
                <CardTitle>Raw Extracted Text</CardTitle>
                <CardDescription>First 2000 characters of extracted text for debugging</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                  {rawText.substring(0, 2000)}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
