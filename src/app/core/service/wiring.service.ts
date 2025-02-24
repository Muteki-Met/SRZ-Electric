import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WiringService {
  private colors = ['#CC0000', '#0000CC', '#009900', '#CCCC00', '#660066', '#CC8400', '#CC99A2', '#009999'];

  shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  calculateBezierPoints(startX: number, startY: number, endX: number, endY: number): number[] {
    const controlPointX1 = startX;
    const controlPointY1 = startY - 30;
    const controlPointX2 = startX + (endX - startX) / 2;
    const controlPointY2 = (startY + endY) / 2 + 50;

    return [
      startX, startY,
      controlPointX1, controlPointY1,
      controlPointX2, controlPointY2,
      endX, endY,
    ];
  }

  generateConnectorPositions(count: number, spacing: number, yPosition: number): { x: number; y: number }[] {
    return Array.from({length: count}, (_, i) => ({
      x: 135 + i * spacing,
      y: yPosition,
    }));
  }

  getConnectorColors(index: number): string {
    return this.colors[index % this.colors.length];
  }
}
