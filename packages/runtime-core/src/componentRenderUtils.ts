import { ShapeFlags } from '../../shared/src/shapeFlags';
import { ComponentInternalInstance } from './component';

export function renderComponentRoot(instance: ComponentInternalInstance) {
  const { vnode, render, proxy, attrs } = instance;
  let result;
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // render 中使用的 this 即 proxy
    result = render.call(proxy);
    // @IGNORE 复杂的 props 处理过程
    // 目的是将 instance.attr 传递到 subtree.props
    // 这里简单合并一下
    result.props = {
      ...result.props,
      ...attrs
    };
  }
  return result;
}
