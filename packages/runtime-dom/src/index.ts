import { createRenderer } from '../../runtime-core/src/renderer';
import { extend } from '../../shared/src';
import { nodeOps } from './nodeOps';
import { patchProp } from './patchProp';

const rendererOptions = extend({ patchProp }, nodeOps);

// 单例模式
let renderer;
function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions));
}

export function render(vnode, container) {
  ensureRenderer().render(vnode, container);
}

export function createApp(...args) {
  // @IGNORE 为求简单，直接导出
  return ensureRenderer().createApp(...args);
}

export * from '../../runtime-core/src';
