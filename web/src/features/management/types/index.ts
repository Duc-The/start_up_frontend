export type Row = {
  id: string
  name?: string
  displayName?: string
  code?: string
  email?: string
  version?: number
  publicationStatus?: string
  status?: string
  details?: Record<string, unknown>
  [key: string]: unknown
}
export type Choice = { id: string; name: string; children?: Choice[] }
