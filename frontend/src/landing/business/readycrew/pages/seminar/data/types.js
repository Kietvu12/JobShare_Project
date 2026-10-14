export type SeminarSection = {
  id: string
  title: string
  listHref: string
  listLabel: string
  hasTagFilter?: boolean
  items: SeminarItem[]
}
