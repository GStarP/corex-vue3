import { createVNode } from './vnode';

export function createAppAPI(render) {
  // 用根组件创建一个应用，拥有 use 等 API
  // 可以通过 app.mount 挂载到 DOM 节点上
  return function createApp(rootComponent, rootProps = null) {
    let isMounted = false;
    const app = {
      _container: null,
      // @IGNORE use, mixin, component 等 API
      mount(rootContainer) {
        if (!isMounted) {
          const vnode = createVNode(rootComponent, rootProps);
          render(vnode, rootContainer);
          isMounted = true;
          app._container = rootContainer;
          return vnode.component.proxy;
        }
      },
      // unmount 即 mount(null)
      unmount() {
        if (isMounted) {
          render(null, app._container);
        }
      }
    };
    return app;
  };
}
