import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'

let registered = false

export function ensureChartsRegistered() {
  if (registered) return
  ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)
  registered = true
}

