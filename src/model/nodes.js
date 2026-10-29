// Layer (node) model. Every node is positioned by its top-left corner (x, y)
// with a width/height box; rotation is in degrees around that corner, the way
// Konva treats a Group.

let counter = 0;
export const uid = () => `n${Date.now().toString(36)}${(counter++).toString(36)}`;

const BASE = {
  x: 0, y: 0, width: 100, height: 100, rotation: 0,
  opacity: 1, visible: true, locked: false,
  shadow: null, // { color, blur, x, y }
};

export const TYPE_LABEL = {
  rect: 'Rectangle', ellipse: 'Ellipse', triangle: 'Triangle', star: 'Star',
  line: 'Line', text: 'Text', image: 'Image',
};

export function createNode(type, props = {}) {
  const base = { ...BASE, id: uid(), type, name: props.name || TYPE_LABEL[type] };
  switch (type) {
    case 'rect':
      return { ...base, fill: solid('#e53935'), stroke: null, strokeWidth: 0, cornerRadius: 0, ...props };
    case 'ellipse':
    case 'triangle':
      return { ...base, fill: solid('#1e88e5'), stroke: null, strokeWidth: 0, ...props };
    case 'star':
      return { ...base, fill: solid('#f9a825'), stroke: null, strokeWidth: 0, points: 5, innerRatio: 0.45, ...props };
    case 'line':
      return { ...base, height: 4, stroke: '#ffffff', strokeWidth: 4, dash: false, ...props };
    case 'text':
      return {
        ...base, width: 400, height: 60,
        text: 'Your text here',
        fontFamily: 'Inter', fontSize: 48, fontWeight: '700', italic: false,
        fill: solid('#ffffff'), align: 'left', verticalAlign: 'top',
        lineHeight: 1.25, letterSpacing: 0, uppercase: false, underline: false,
        textStroke: null, textStrokeWidth: 0,
        background: null, padding: 0, cornerRadius: 0,
        autoHeight: true,
        ...props,
      };
    case 'image':
      return {
        ...base, width: 400, height: 300,
        src: '', fit: 'cover', zoom: 1, focusX: 0.5, focusY: 0.5,
        cornerRadius: 0, stroke: null, strokeWidth: 0,
        brightness: 0, contrast: 0, grayscale: false, blur: 0,
        ...props,
      };
    default:
      throw new Error(`Unknown node type ${type}`);
  }
}

// Fills are { type: 'solid', color } or { type: 'linear', from, to, angle }.
export const solid = (color) => ({ type: 'solid', color });
export const linear = (from, to, angle = 90) => ({ type: 'linear', from, to, angle });

export function cloneNodes(nodes, offset = 20) {
  return nodes.map((n) => ({
    ...JSON.parse(JSON.stringify(n)),
    id: uid(),
    x: n.x + offset,
    y: n.y + offset,
  }));
}

export function newDocument(width = 1080, height = 1080, nodes = [], background = '#ffffff') {
  return { version: 2, name: 'Untitled photocard', width, height, background, nodes };
}

// Expands {date} style tokens so cards always show today's date.
export function expandTokens(text) {
  if (!text || text.indexOf('{') === -1) return text;
  const now = new Date();
  return text
    .replace(/\{date\}/g, now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
    .replace(/\{date_bn\}/g, now.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }))
    .replace(/\{time\}/g, now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
}
