/**
 * Compliance reporting types for enterprise governance and regulatory requirements
 */

export type ReportFormat = 'pdf' | 'csv' | 'json' | 'html' | 'xlsx'

export type ComplianceFramework =
  | 'SOC2'
  | 'ISO27001'
  | 'GDPR'
  | 'PCI_DSS'
  | 'HIPAA'
  | 'SOX'
  | 'CUSTOM'

export interface ComplianceReport {
  id: string
  framework: ComplianceFramework
  period: ReportPeriod
  generatedAt: Date
  generatedBy: string
  format: ReportFormat
  data: ReportData
  metadata?: Record<string, unknown>
}

export interface ReportPeriod {
  startDate: Date
  endDate: Date
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
}

export interface ReportData {
  summary: ReportSummary
  sections: ReportSection[]
  attachments?: ReportAttachment[]
}

export interface ReportSummary {
  title: string
  description: string
  keyFindings: string[]
  metrics: ReportMetric[]
  recommendations?: string[]
}

export interface ReportSection {
  id: string
  title: string
  content: string
  tables?: ReportTable[]
  charts?: ReportChart[]
  metadata?: Record<string, unknown>
}

export interface ReportTable {
  id: string
  title: string
  headers: string[]
  rows: string[][]
  summary?: string
}

export interface ReportChart {
  id: string
  type: 'bar' | 'line' | 'pie' | 'table'
  title: string
  data: ChartData
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color?: string
  }[]
}

export interface ReportMetric {
  name: string
  value: number | string
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  change?: number
  status?: 'compliant' | 'non_compliant' | 'partial'
}

export interface ReportAttachment {
  id: string
  name: string
  type: 'evidence' | 'screenshot' | 'log' | 'certificate'
  url?: string
  data?: ArrayBuffer
}

export interface SOC2ReportData extends ReportData {
  summary: SOCSummary
  sections: SOC2Sections
}

export interface SOCSummary extends ReportSummary {
  framework: 'SOC2'
  trustCriteria: string[]
  controlPoints: number
  compliantControls: number
  exceptions: string[]
}

export interface SOC2Sections extends ReportSection[] {
  accessControl: ReportSection
  incidentResponse: ReportSection
  changeManagement: ReportSection
  riskAssessment: ReportSection
}

export interface ComplianceReportGenerator {
  generateSOC2Report(period: ReportPeriod): Promise<ComplianceReport>
  generateTransactionReport(period: ReportPeriod): Promise<ComplianceReport>
  generateAuditReport(period: ReportPeriod): Promise<ComplianceReport>
  generateUserActivityReport(period: ReportPeriod): Promise<ComplianceReport>
  generatePolicyViolationReport(period: ReportPeriod): Promise<ComplianceReport>
  generateSecurityIncidentReport(period: ReportPeriod): Promise<ComplianceReport>
}

export interface ReportExporter {
  exportPDF(report: ComplianceReport): Promise<Blob>
  exportCSV(report: ComplianceReport): Promise<string>
  exportJSON(report: ComplianceReport): Promise<string>
  exportHTML(report: ComplianceReport): Promise<string>
}

export interface ReportSchedule {
  id: string
  framework: ComplianceFramework
  period: ReportPeriod['type']
  recipients: string[]
  enabled: boolean
  lastGenerated?: Date
  nextDue?: Date
}
