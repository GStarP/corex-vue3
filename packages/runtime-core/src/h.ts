import { createVNode } from './vnode';

// @IGNORE
// Vue3 支持 h(type, children)，因此做了很多参数判断
// 这里为了简单，只是简单地将 createVNode 导出
export function h(type, props?, children?) {
  return createVNode(type, props, children);
}
