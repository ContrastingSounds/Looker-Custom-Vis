export interface FlatData {
  headers: Header[]
  columns: Column[]
  dims: object[]
  number_of_dimensions: number
  data: Row[]
  subtotals: boolean
  totals: boolean
  raw: () => { [key: string]: number | string }
}

export interface Header {
  id: string
}

export interface Column {
  id: string
  field: object
  raw: () => { [key: string]: string }
}

export interface Row {
  type: 'total' | 'subtotal' | 'line_item'
  sort?: [number, number, number]
  data?: object
  raw: () => { [key: string]: number | string }
}