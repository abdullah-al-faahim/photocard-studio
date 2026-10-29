import React, { useEffect, useLayoutEffect, useRef } from 'react';
import Konva from 'konva';
import { Group, Rect, Ellipse, Line, Text, Image as KImage } from 'react-konva';
import { useImage } from './assets';
import { expandTokens } from '../model/nodes';
import { BENGALI_RE } from '../model/presets';

// Converts a fill model into Konva attributes. `ox, oy` shift the gradient
// for shapes whose local origin isn't the top-left corner (ellipses).
export function fillAttrs(fill, w, h, ox = 0, oy = 0) {
  if (!fill) return { fillEnabled: false };
  if (fill.type === 'linear') {
    const a = ((fill.angle || 0) * Math.PI) / 180;
    const dx = Math.sin(a), dy = -Math.cos(a);
    const len = Math.abs((w / 2) * dx) + Math.abs((h / 2) * dy);
    const cx = w / 2 + ox, cy = h / 2 + oy;
    return {
      fillEnabled: true,
      fillPriority: 'linear-gradient',
      fillLinearGradientStartPoint: { x: cx - dx * len, y: cy - dy * len },
      fillLinearGradientEndPoint: { x: cx + dx * len, y: cy + dy * len },
      fillLinearGradientColorStops: [0, fill.from, 1, fill.to],
    };
  }
  return { fillEnabled: true, fillPriority: 'color', fill: fill.color };
}

function shadowAttrs(shadow) {
  if (!shadow) return { shadowEnabled: false };
  return {
    shadowEnabled: true, shadowColor: shadow.color, shadowBlur: shadow.blur,
    shadowOffsetX: shadow.x, shadowOffsetY: shadow.y, shadowOpacity: 1,
  };
}

function strokeAttrs(n) {
  if (!n.stroke || !n.strokeWidth) return { strokeEnabled: false };
  return { strokeEnabled: true, stroke: n.stroke, strokeWidth: n.strokeWidth, strokeScaleEnabled: false };
}

function starPoints(w, h, count, inner) {
  const pts = [];
  for (let i = 0; i < count * 2; i++) {
    const r = i % 2 === 0 ? 1 : inner;
    const a = (Math.PI * i) / count - Math.PI / 2;
    pts.push(w / 2 + (Math.cos(a) * r * w) / 2, h / 2 + (Math.sin(a) * r * h) / 2);
  }
  return pts;
}

function roundedClip(w, h, r) {
  return (ctx) => {
    const rr = Math.max(0, Math.min(r || 0, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(rr, 0);
    ctx.arcTo(w, 0, w, h, rr);
    ctx.arcTo(w, h, 0, h, rr);
    ctx.arcTo(0, h, 0, 0, rr);
    ctx.arcTo(0, 0, w, 0, rr);
    ctx.closePath();
  };
}

function ImageContent({ n }) {
  const img = useImage(n.src);
  const imgRef = useRef(null);
  const w = n.width, h = n.height;
  const hasFilters = n.brightness || n.contrast || n.grayscale || n.blur;

  let draw = null;
  if (img) {
    const iw = img.naturalWidth, ih = img.naturalHeight;
    let dw = w, dh = h;
    if (n.fit !== 'stretch') {
      const s = (n.fit === 'contain' ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih)) * (n.zoom || 1);
      dw = iw * s; dh = ih * s;
    }
    draw = { x: (w - dw) * n.focusX, y: (h - dh) * n.focusY, w: dw, h: dh };
  }

  useEffect(() => {
    const node = imgRef.current;
    if (!node) return;
    if (hasFilters) {
      node.cache({ pixelRatio: 2 });
    } else {
      node.clearCache();
    }
    node.getLayer() && node.getLayer().batchDraw();
  }, [img, hasFilters, n.brightness, n.contrast, n.grayscale, n.blur, draw && draw.w, draw && draw.h]);

  const filters = [];
  if (n.brightness) filters.push(Konva.Filters.Brighten);
  if (n.contrast) filters.push(Konva.Filters.Contrast);
  if (n.grayscale) filters.push(Konva.Filters.Grayscale);
  if (n.blur) filters.push(Konva.Filters.Blur);

  return (
    <>
      {n.shadow && <Rect width={w} height={h} cornerRadius={n.cornerRadius} fill="#000" {...shadowAttrs(n.shadow)} />}
      <Group clipFunc={roundedClip(w, h, n.cornerRadius)}>
        {draw ? (
          <KImage
            ref={imgRef} image={img} x={draw.x} y={draw.y} width={draw.w} height={draw.h}
            filters={filters} brightness={n.brightness} contrast={n.contrast} blurRadius={n.blur}
          />
        ) : (
          <>
            <Rect width={w} height={h} fill="#3a4150" />
            <Line points={[0, 0, w, h]} stroke="#ffffff22" strokeWidth={2} strokeScaleEnabled={false} />
            <Line points={[w, 0, 0, h]} stroke="#ffffff22" strokeWidth={2} strokeScaleEnabled={false} />
            <Text
              width={w} height={h} align="center" verticalAlign="middle" fill="#ffffffaa"
              fontFamily="Inter" fontStyle="600" fontSize={Math.max(12, Math.min(w, h) * 0.07)}
              text={n.src ? 'Loading…' : 'Drop a photo here\nor double-click'} lineHeight={1.4}
            />
          </>
        )}
      </Group>
      {n.stroke && n.strokeWidth > 0 && (
        <Rect width={w} height={h} cornerRadius={n.cornerRadius} listening={false} {...strokeAttrs(n)} />
      )}
    </>
  );
}

function TextContent({ n, hidden, onMeasure, fontVersion }) {
  const ref = useRef(null);
  const raw = expandTokens(n.text || '');
  const text = n.uppercase ? raw.toLocaleUpperCase() : raw;
  // Konva draws letter-by-letter when spacing is set, which breaks Bengali conjuncts.
  const letterSpacing = BENGALI_RE.test(text) ? 0 : n.letterSpacing;
  const fontStyle = `${n.italic ? 'italic ' : ''}${n.fontWeight}`;

  useLayoutEffect(() => {
    const t = ref.current;
    if (!t || !onMeasure) return;
    const patch = {};
    if (n.autoWidth) {
      const w = Math.ceil(t.width());
      if (Math.abs(w - n.width) > 0.5) patch.width = w;
    }
    if (n.autoHeight || n.autoWidth) {
      const h = Math.ceil(t.height());
      if (Math.abs(h - n.height) > 0.5) patch.height = h;
    }
    if (Object.keys(patch).length) onMeasure(n.id, patch);
  });

  return (
    <>
      {n.background && (
        <Rect
          width={n.width} height={n.height} cornerRadius={n.cornerRadius} fill={n.background}
          {...shadowAttrs(n.shadow)}
        />
      )}
      <Text
        ref={ref}
        key={fontVersion}
        text={text}
        width={n.autoWidth ? undefined : n.width}
        height={n.autoHeight || n.autoWidth ? undefined : n.height}
        wrap={n.autoWidth ? 'none' : 'word'}
        padding={n.padding}
        fontFamily={`"${n.fontFamily}"`}
        fontSize={n.fontSize}
        fontStyle={fontStyle}
        align={n.align}
        verticalAlign={n.verticalAlign}
        lineHeight={n.lineHeight}
        letterSpacing={letterSpacing}
        textDecoration={n.underline ? 'underline' : ''}
        opacity={hidden ? 0 : 1}
        {...fillAttrs(n.fill, n.width, n.height)}
        {...(n.textStroke && n.textStrokeWidth ? { stroke: n.textStroke, strokeWidth: n.textStrokeWidth, fillAfterStrokeEnabled: true } : {})}
        {...(n.background ? {} : shadowAttrs(n.shadow))}
      />
    </>
  );
}

function ShapeContent({ n }) {
  const common = { ...strokeAttrs(n), ...shadowAttrs(n.shadow) };
  switch (n.type) {
    case 'rect':
      return <Rect width={n.width} height={n.height} cornerRadius={n.cornerRadius} {...fillAttrs(n.fill, n.width, n.height)} {...common} />;
    case 'ellipse':
      return (
        <Ellipse
          x={n.width / 2} y={n.height / 2} radiusX={n.width / 2} radiusY={n.height / 2}
          {...fillAttrs(n.fill, n.width, n.height, -n.width / 2, -n.height / 2)} {...common}
        />
      );
    case 'triangle':
      return <Line closed points={[n.width / 2, 0, n.width, n.height, 0, n.height]} {...fillAttrs(n.fill, n.width, n.height)} {...common} />;
    case 'star':
      return <Line closed points={starPoints(n.width, n.height, n.points || 5, n.innerRatio || 0.45)} {...fillAttrs(n.fill, n.width, n.height)} {...common} />;
    case 'line':
      return (
        <Line
          points={[0, n.height / 2, n.width, n.height / 2]} stroke={n.stroke} strokeWidth={n.strokeWidth}
          dash={n.dash ? [n.strokeWidth * 3, n.strokeWidth * 2] : undefined} lineCap="round"
          hitStrokeWidth={Math.max(16, n.strokeWidth)} {...shadowAttrs(n.shadow)}
        />
      );
    default:
      return null;
  }
}

function NodeShape({ n, draggable, hiddenText, onMeasure, fontVersion, handlers }) {
  return (
    <Group
      id={n.id}
      name="node"
      x={n.x}
      y={n.y}
      rotation={n.rotation}
      opacity={n.opacity}
      visible={n.visible}
      listening={!n.locked}
      draggable={draggable}
      {...handlers}
    >
      {n.type === 'text' && <TextContent n={n} hidden={hiddenText} onMeasure={onMeasure} fontVersion={fontVersion} />}
      {n.type === 'image' && <ImageContent n={n} />}
      {n.type !== 'text' && n.type !== 'image' && <ShapeContent n={n} />}
    </Group>
  );
}

export default React.memo(NodeShape);
