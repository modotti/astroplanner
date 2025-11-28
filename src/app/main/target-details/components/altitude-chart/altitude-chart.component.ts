import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  Chart,
  ChartConfiguration,
  ChartDataset,
  ChartOptions,
  registerables
} from 'chart.js';
import { AltitudeSample } from 'src/app/core/services/astro-core/astro-core-service';

Chart.register(...registerables);

@Component({
  selector: 'app-altitude-chart',
  standalone: true,
  templateUrl: './altitude-chart.component.html',
  styleUrls: ['./altitude-chart.component.scss']
})
export class AltitudeChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('altitudeChartCanvas', { static: true })
  altitudeChartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() samples: AltitudeSample[] = [];
  @Input() minAltitude: number = 30;

  private chart?: Chart;

  ngAfterViewInit(): void {
    if (this.samples?.length) {
      this.buildChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['samples'] && this.altitudeChartCanvas) {
      this.buildChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private buildChart(): void {
    if (!this.samples?.length) return;

    // destroy previous chart
    if (this.chart) {
      this.chart.destroy();
    }

    // Sort by time ASC
    const sortedSamples = [...this.samples].sort(
      (a, b) => a.time.getTime() - b.time.getTime()
    );

    const labels = sortedSamples.map((s) => this.formatTimeLabel(s.time));
    const altitudes = sortedSamples.map((s) => s.altitude);

    const dataset: ChartDataset<'line'> = {
      data: altitudes,
      tension: 0.4,
      borderColor: '#E80E4F',
      fill: {
        target: 'origin',
        above: 'rgba(237, 19, 95, 0.25)',
        below: '#333'
      },
      borderWidth: 2,
      pointRadius: 1,
      pointHoverRadius: 5
    };

    const dashedLinePlugin = this.createDashedLinePlugin(this.minAltitude);

    const options: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { maxRotation: 0, autoSkip: true }
        },
        y: {
          suggestedMin: -20,
          suggestedMax: 90,
          ticks: { stepSize: 10 }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const altitude = ctx.parsed.y;
              const sample = sortedSamples[ctx.dataIndex];
              const az = sample.azimuth.toFixed(0);
              return `Alt: ${altitude?.toFixed(1)}° | Az: ${az}° (${sample.direction})`;
            },
            title: (items) => {
              const sample = sortedSamples[items[0].dataIndex];
              return this.formatTooltipTitle(sample.time);
            }
          }
        }
      }
    };

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      plugins: [dashedLinePlugin],
      data: {
        labels,
        datasets: [dataset]
      },
      options
    };

    const ctx = this.altitudeChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, config);
  }

  private formatTimeLabel(date: Date): string {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatTooltipTitle(date: Date): string {
    return date.toLocaleString([], {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private createDashedLinePlugin(altitude: number) {
    return {
      id: `dashedLine${altitude}`,
      afterDraw(chart: any) {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea) return;

        const yScale = scales['y'];
        const y = yScale.getPixelForValue(altitude);

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1.2;
        ctx.moveTo(chartArea.left, y);
        ctx.lineTo(chartArea.right, y);
        ctx.stroke();
        ctx.restore();
      }
    };
  }
}