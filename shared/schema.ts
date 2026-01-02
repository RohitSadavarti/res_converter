import { z } from "zod";

// Subject Schema - handles individual subject marks
export const subjectSchema = z.object({
  name: z.string(),
  heads: z.record(z.string(), z.string()), // e.g. { TH: "80", IN: "20" }
  total: z.string().optional(),
  grade: z.string().optional(),
  gradePoint: z.string().optional(),
  credits: z.string().optional(),
});

// Student Schema - main data structure for parsed results
export const studentSchema = z.object({
  seatNo: z.string(),
  name: z.string(),
  motherName: z.string().optional(),
  collegeCode: z.string().optional(),
  centerCode: z.string().optional(),
  abcId: z.string().optional(),
  subjects: z.array(subjectSchema),
  result: z.string().optional(), // PASS/FAIL/ATKT
  cgpi: z.string().optional(), // Semester grade/pointer
  totalMarks: z.string().optional(),
});

export type Student = z.infer<typeof studentSchema>;
export type Subject = z.infer<typeof subjectSchema>;

// Just to satisfy imports if needed, but we rely on the types above
export const insertStudentSchema = studentSchema;
