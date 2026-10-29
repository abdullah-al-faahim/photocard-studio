import { useStore } from '../state/store';
import { createNode } from '../model/nodes';
import { loadImageSize } from './assets';

// Adds an image layer at a point, or swaps the photo of an image layer
// that's under the point (so dropping onto a template's photo slot fills it).
export async function placeImage(src, point) {
  const st = useStore.getState();
  const { doc } = st;
  if (point) {
    const target = [...doc.nodes].reverse().find((n) => n.type === 'image' && n.visible && !n.locked
      && point.x >= n.x && point.x <= n.x + n.width && point.y >= n.y && point.y <= n.y + n.height);
    if (target) {
      st.updateNodes([target.id], { src, zoom: 1, focusX: 0.5, focusY: 0.5 });
      st.select([target.id]);
      return;
    }
  }
  let w = doc.width * 0.6, h = doc.height * 0.6;
  try {
    const nat = await loadImageSize(src);
    const s = Math.min((doc.width * 0.8) / nat.w, (doc.height * 0.8) / nat.h, 1);
    w = nat.w * s; h = nat.h * s;
  } catch (e) { /* keep default size */ }
  const cx = point ? point.x : doc.width / 2, cy = point ? point.y : doc.height / 2;
  st.addNodes([createNode('image', { src, x: cx - w / 2, y: cy - h / 2, width: w, height: h })]);
}
