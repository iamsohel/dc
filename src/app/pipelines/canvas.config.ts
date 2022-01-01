import { OverlaySpec } from 'jsplumb';

export const pipelineCanvasConfig = {
  gridSize: [20, 20],
  zoom: {
    minZoomValue: 0.1,
    maxZoomLevel: 1.5,
    zoomInScaleMultiplier: 1.10,
    zoomOutScaleMultiplier: 0.90,
    transformOrigin: {
      x: 0,
      y: 0,
    },
  },
  jsPlumbDefaults: {
    Container: '.pipeline-container',
    ConnectionOverlays: <OverlaySpec[]> [
      [
        'Arrow',
        {
          location: 1,
          visible: true,
          width: 11,
          length: 11,
        },
      ],
    ],
  },
  jsPlumbViewSettings: {
    basicConnectionType: {
      hoverPaintStyle: {
        strokeWidth: 3,
        stroke: '#0d47a1',
      },
      paintStyle: {
        strokeWidth: 1,
        stroke: '#216477',
      },
    },
    connectorPaintStyle: {
      stroke: '#0d47a1',
    },
    connectorHoverStyle: {
      stroke: '#216477',
    },
    endpointHoverStyle: {
    },
    sourceEndpoint: {
      endpoint: 'Dot',
      paintStyle: {
        stroke: '#0d47a1',
        fill: 'transparent',
        radius: 7,
        strokeWidth: 1,
      },
      isSource: true,
      maxConnections: 1,
      connectorStyle: this.connectorPaintStyle,
      hoverPaintStyle: this.endpointHoverStyle,
      connectorHoverStyle: this.connectorHoverStyle,
      dragOptions: {},
      overlays: [
        [
          'Label',
          {
            location: [0.5, 1.5],
            label: 'Drag',
            cssClass: 'endpointSourceLabel',
            visible: false,
          },
        ],
      ],
    },
    targetEndpoint: {
      endpoint: 'Dot',
      paintStyle: {
        fill: '#0d47a1',
        radius: 7,
      },
      hoverPaintStyle: this.endpointHoverStyle,
      maxConnections: 1,
      dropOptions: { hoverClass: 'hover', activeClass: 'active' },
      isTarget: true,
      overlays: [
        [
          'Label',
          {
            location: [0.5, -0.5],
            label: 'Drop',
            cssClass: 'endpointTargetLabel',
            visible: false,
          },
        ],
      ],
    },
  },
};

