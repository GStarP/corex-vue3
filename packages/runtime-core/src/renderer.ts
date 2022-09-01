import { invokeArrayFns } from '../../shared/src';
import { ShapeFlags } from '../../shared/src/shapeFlags';
import { createAppAPI } from './apiCreateApp';
import {
  ComponentInternalInstance,
  createComponentInstance,
  setupComponent
} from './component';
import { renderComponentRoot } from './componentRenderUtils';
import { Text, VNode } from './vnode';

export function createRenderer(options) {
  // hostCreateElement 等只是接口，具体实现视传入的 options 而定
  const {
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
    insert: hostInsert,
    createText: hostCreateText
  } = options;

  // 同时负责 首次挂载 和 后续更新
  // patch(null, vnode) 就相当于首次渲染
  function patch(
    n1,
    n2,
    container = null,
    anchor = null,
    parentComponent: any = null
  ) {
    console.log('[patch]\n' + 'n1:\n', n1, '\nn2:\n', n2);
    const { type, shapeFlag } = n2;
    // 根据新节点的类型进行处理
    switch (type) {
      // 文本节点
      case Text:
        processText(n1, n2, container, anchor);
        break;
      // 其它节点均基于 ShapeFlag 处理
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, anchor, parentComponent);
        }
    }
  }

  // 当 n2 是文本节点
  function processText(n1, n2, container, anchor) {
    if (n1 === null) {
      n2.el = hostCreateText(n2.children as string);
      hostInsert(n2.el, container, anchor);
    } else {
      // update
    }
  }
  // 当 n2 是 DOM 元素
  function processElement(n1, n2, container, anchor) {
    if (n1 === null) {
      mountElement(n2, container, anchor);
    } else {
      // update
    }
  }
  // 当 n2 是组件
  function processComponent(n1, n2, container, anchor, parentComponent) {
    if (n1 === null) {
      mountComponent(n2, container, anchor, parentComponent);
    } else {
      // update
    }
  }

  // 挂载子节点
  function mountChildren(children, container) {
    children.forEach((vNodeChild) => {
      patch(null, vNodeChild, container);
    });
  }
  // 挂载 DOM 元素
  function mountElement(vnode, container, anchor) {
    const { shapeFlag, props } = vnode;

    // 创建对应的 DOM 节点
    const el = (vnode.el = hostCreateElement(vnode.type));
    // 处理子节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 如果子节点是文本，直接设置文本
      hostSetElementText(el, vnode.children as string);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 如果子节点是数组，在此元素上挂载子节点
      mountChildren(vnode.children, el);
    }

    // 处理 props
    if (props) {
      for (const key in props) {
        // @IGNORE 忽略框架保留的 key，比如 ref
        const nextVal = props[key];
        hostPatchProp(el, key, null, nextVal);
      }
    }

    // 插入 DOM
    hostInsert(el, container, anchor);
  }
  // 挂载组件
  function mountComponent(initialVNode, container, anchor, parentComponent) {
    // 创建组件实例
    const instance =
      initialVNode.component ||
      (initialVNode.component = createComponentInstance(
        initialVNode,
        parentComponent
      ));

    // 初始化组件实例
    setupComponent(instance);

    // 初始化组件渲染
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  const setupRenderEffect = (
    instance: ComponentInternalInstance,
    initialVNode: VNode,
    container,
    anchor
  ) => {
    // 真正的渲染&更新函数
    const componentUpdateFn = () => {
      // 未挂载 => 挂载
      if (!instance.isMounted) {
        const { bm, m } = instance;
        // [Hook] beforeMount
        console.log('[beforeMount]\n', instance);
        if (bm) {
          invokeArrayFns(bm);
        }
        // 生成组件对应的 VDOM
        const subTree = (instance.subTree = renderComponentRoot(instance));
        // 挂载 subTree
        patch(null, subTree, container, anchor, instance);
        // 真正被渲染的是 subTree，但 vnode 也要记住 subTree 的 el
        initialVNode.el = subTree.el;
        // [Hook] mounted
        console.log('[mounted]\n', instance);
        if (m) {
          // @IGNORE 目前是同步渲染
          invokeArrayFns(m);
        }
        // 组件已挂载
        instance.isMounted = true;

        // #2458: deference mount-only object parameters to prevent memleaks
        // 将只在挂载阶段用到的对象设 null 防止内存泄漏
        initialVNode = container = anchor = null as any;
      } else {
        // update
      }
    };

    // @IGNORE 暂不引入响应式渲染
    const update = (instance.update = () => componentUpdateFn());
    update();
  };

  const render = (vnode, container) => {
    console.log('[render]\n' + 'vnode:\n', vnode, '\ncontainer:\n', container);
    patch(null, vnode, container);
  };

  return {
    render,
    createApp: createAppAPI(render)
  };
}
