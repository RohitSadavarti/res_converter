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
  const [subjectNames, setSubjectNames] = useState<string[]>([])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
      setError(null)
      setStudents([])
      setSubjectNames([])
    } else {
      setError("Please select a valid PDF file")
    }
  }, [])

  const processFile = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setProgress(10)

    try {
      const result = await parseStudentResultsPDF(file)
      setProgress(80)

      if (result.students.length === 0) {
        setError("No student records found. Ensure this is a valid MU result PDF.")
      } else {
        setStudents(result.students)
        setSubjectNames(result.subjectNames)
      }
      setProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse PDF")
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (students.length === 0) return
    exportToExcel(students, subjectNames, file?.name.replace(".pdf", "") || "result_parsed")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Upload PDF</CardTitle>
            <CardDescription>Upload a result PDF to extract student data with automatic subject detection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary cursor-pointer">
              <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" id="pdf-upload" />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">{file ? file.name : "Click to browse PDF"}</p>
              </label>
            </div>

            {file && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-medium">{file.name}</span>
                <Button onClick={processFile} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Extract Data"}
                </Button>
              </div>
            )}
            {loading && <Progress value={progress} className="h-2 mt-4" />}
          </CardContent>
        </Card>

        {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

        {students.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Extracted Data</CardTitle>
                <CardDescription>Detected {subjectNames.length} subjects for {students.length} students</CardDescription>
              </div>
              <Button onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export to Excel</Button>
            </CardHeader>
            <CardContent><DataPreview students={students} /></CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
