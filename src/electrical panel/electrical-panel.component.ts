import { AfterViewInit, Component, inject, OnDestroy } from '@angular/core';
import Konva from 'konva';
import { Subscription } from 'rxjs';
import { ConnectorConfigService } from '../connector-config.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-electrical-panel',
  imports: [CommonModule],
  template: `
    <main
      class="canvas-container"
      [ngClass]="{ 'fade-in': imageChanged }"
      [ngStyle]="{'background-image': 'url(' + backgroundImage + ')'}">
      <section id="konva-container"></section>
      @if (isOpen) {
        <img
          class="door-overlay"
          src="/electrical-panel-asset/bg_cabinet_door_open.png"
          alt="Door">
      }
    </main>

  `,
  styles: `
    .canvas-container {
      width: 650px;
      height: 700px;
      position: relative;
      background-size: cover;
      background-position: center;
      transition: opacity 1s ease-in-out;
    }

    .fade-in {
      opacity: 0;
    }

    .door-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

  `
})
export class ElectricalPanelComponent implements AfterViewInit, OnDestroy {
  stage!: Konva.Stage;
  layer!: Konva.Layer;
  connectors: { [key: string]: Konva.Rect } = {};
  activeLine: Konva.Line | null = null;
  connections: { [key: string]: string } = {};
  connectedPairs: Set<string> = new Set();
  imageChanged = false;
  isOpen = false;
  backgroundImage = '/electrical-panel-asset/bg_cabinet_close.png';

  private connectorsCountSub: Subscription | undefined;
  private readonly _configService = inject(ConnectorConfigService);


  ngAfterViewInit(): void {
    this.stage = new Konva.Stage({
      container: 'konva-container',
      width: 800,
      height: 700,
    });

    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    setTimeout(() => {
      this.imageChanged = true;
      setTimeout(() => {
        this.backgroundImage = '/electrical-panel-asset/bg_cabinet_open.png';
        this.isOpen = true
        this.connectorsCountSub = this._configService.connectorsCount$.subscribe((count) => {
          this.resetConnectors(count);
        });
        this.imageChanged = false;
      }, 1000);
    }, 1000);
  }

  ngOnDestroy(): void {
    this.connectorsCountSub?.unsubscribe();
  }

  resetConnectors(count: number): void {
    this.layer.destroyChildren();
    this.connections = {};
    this.connectedPairs.clear();

    const barPositions = [95, 210, 320];
    const selectedBarPosition = barPositions[Math.floor(Math.random() * barPositions.length)];

    const barImage = new Image();
    barImage.src = 'electrical-panel-asset/bg_bar.png';
    barImage.onload = () => {
      const bar = new Konva.Image({
        x: 55,
        y: selectedBarPosition,
        image: barImage,
      });

      this.layer.add(bar);
      this.layer.draw();


      const allConnectors = Array.from({length: count}, (_, i) => String.fromCharCode(65 + i)); // A, B, C, ...
      const bottomConnectors = allConnectors.map((id) => `${id}1`);
      const topConnectors = allConnectors.map((id) => `${id}2`);

      const shuffledBottom = this.shuffleArray([...bottomConnectors]);
      const shuffledTop = this.shuffleArray([...topConnectors]);


      const colors = ['#CC0000', '#0000CC', '#009900', '#CCCC00', '#660066', '#CC8400', '#CC99A2', '#009999'];

      const spacing = 45;
      const bottomPositions = Array.from({length: count}, (_, i) => ({
        x: 135 + i * spacing,
        y: 550,
      }));

      const topPositions = Array.from({length: count}, (_, i) => ({
        x: 200 + i * spacing,
        y: selectedBarPosition
      }));

      const shuffledBottomPositions = this.shuffleArray([...bottomPositions]);
      const shuffledTopPositions = this.shuffleArray([...topPositions]);

      for (let i = 0; i < count; i++) {
        const bottomId = shuffledBottom[i];
        const topId = shuffledTop[i];

        const bottomPosition = shuffledBottomPositions[i];
        const topPosition = shuffledTopPositions[i];

        const colorCode = colors[i % colors.length].replace('#', '');

        const bottomImage = new Image();
        bottomImage.src = `electrical-panel-asset/connector_b_${colorCode}.png`;
        bottomImage.onload = () => {
          const bottomConnector = new Konva.Image({
            x: bottomPosition.x - 10,
            y: bottomPosition.y - 20,
            image: bottomImage,
            width: 14,
            height: 50,
            id: bottomId,
          });

          this.connectors[bottomId] = bottomConnector;
          this.layer.add(bottomConnector);

          bottomConnector.on('mousedown', () => this.startLine(bottomConnector));

          this.layer.draw();
        };

        const topImage = new Image();
        topImage.src = `electrical-panel-asset/connector_t_${colorCode}.png`;
        topImage.onload = () => {
          const topConnector = new Konva.Image({
            x: topPosition.x - 10,
            y: topPosition.y + 25,
            image: topImage,
            width: 14,
            height: 43,
            id: topId,
          });

          this.connectors[topId] = topConnector;
          this.layer.add(topConnector);

          this.layer.draw();
        };

        this.connections[bottomId] = topId;
      }
    };

  }

  startLine(connector: Konva.Image): void {
    if (this.connectedPairs.has(connector.id())) return;

    if (this.activeLine) return;

    const connectorCenterX = connector.x() + connector.width() / 2;
    const connectorCenterY =
      connector.id().endsWith('1')
        ? connector.y() + 6
        : connector.y() + connector.height() + 5;

    let color = 'black';
    const image = connector.image();
    if (image instanceof HTMLImageElement) {
      const match = image.src.match(/connector_([bt])_(.+?)\.png/);
      if (match && match[2]) {
        color = `#${match[2]}`;
      }
    }

    this.activeLine = new Konva.Line({
      points: [connectorCenterX, connectorCenterY, connectorCenterX, connectorCenterY],
      stroke: color,
      strokeWidth: 10,
      lineCap: 'round',
      lineJoin: 'round',
      bezier: true,
      //tension: 0.4,
    });

    this.layer.add(this.activeLine);

    this.stage.on('mousemove', () => {
      const mousePos = this.stage.getPointerPosition();
      if (this.activeLine && mousePos) {
        const points = this.calculateBezierPoints(
          connectorCenterX,
          connectorCenterY,
          mousePos.x,
          mousePos.y
        );
        this.activeLine.points(points);
        this.layer.batchDraw();
      }
    });

    this.stage.on('mouseup', () => this.endLine(connector, color));
  }

  endLine(startConnector: Konva.Image, color: string): void {
    if (!this.activeLine) return;

    const mousePos = this.stage.getPointerPosition();
    if (!mousePos) return;

    const targetConnector = Object.values(this.connectors).find((c) => {
      const centerX = c.x() + (c.width ? c.width() / 2 : 0);
      const centerY =
        c.id().endsWith('1')
          ? c.y() - 5
          : c.y() + c.height() + 5;
      const dist = Math.hypot(centerX - mousePos.x, centerY - mousePos.y);
      return dist < 20;
    });

    if (
      targetConnector &&
      this.connections[startConnector.id()] === targetConnector.id() &&
      targetConnector.id().endsWith('2')
    ) {
      const points = this.calculateBezierPoints(
        this.activeLine.points()[0],
        this.activeLine.points()[1],
        targetConnector.x() + targetConnector.width() / 2,
        targetConnector.id().endsWith('1')
          ? targetConnector.y() + 3
          : targetConnector.y() + targetConnector.height() - 3
      );
      this.activeLine.points(points);
      this.activeLine.stroke(color);
      this.connectedPairs.add(startConnector.id());
      this.connectedPairs.add(targetConnector.id());

      startConnector.off('mousedown');
      targetConnector.off('mousedown');

      if (this.connectedPairs.size === Object.keys(this.connections).length * 2) {
        console.log('Tutti i connettori sono collegati!');
      }
    } else {
      this.activeLine.destroy();
    }

    this.activeLine = null;
    this.layer.batchDraw();
    this.stage.off('mousemove');
    this.stage.off('mouseup');
  }


  private calculateBezierPoints(startX: number, startY: number, endX: number, endY: number): number[] {
    return [
      startX, startY,
      startX, startY - 30,
      startX + (endX - startX) / 2, (startY + endY) / 2 + 50,
      endX, endY,
    ];
  }


  private shuffleArray<T>(array: T[]): T[] {
    return array
      .map(item => ({item, sort: Math.random()}))
      .sort((a, b) => a.sort - b.sort)
      .map(({item}) => item);
  }

}
