import {
  ArcElement,
  BarElement,
  BubbleController,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";

let registered = false;

export function registerCharts() {
  if (registered) return;
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    BubbleController,
    ArcElement,
    Tooltip,
    Legend,
    Filler,
  );
  registered = true;
}
