import { h } from '../src/h';
import { ShapeFlags } from '../../shared/src/shapeFlags';
import { VNode } from '../src/vnode';

// 测试：VNode 模块
describe('vnode', () => {
  // 测试一：创建单个 VNode
  test('create single vnode', () => {
    const vnode = h('div', { id: 'app' }, 'hello');
    expect(vnode.type).toBe('div');
    expect(vnode.props.id).toBe('app');
    expect(vnode.children).toBe('hello');
    expect(vnode.el).toBe(null);
    expect(vnode.shapeFlag).toBe(ShapeFlags.ELEMENT | ShapeFlags.TEXT_CHILDREN);
  });
  // 测试二：创建层叠 VNode
  test('create stacking vnode', () => {
    const vnode = h('div', { id: 'app' }, [
      h('span', null, 'one'),
      h('span', { class: 'red' }, 'two'),
      h('span', null, 'three')
    ]);
    expect(vnode.shapeFlag).toBe(
      ShapeFlags.ELEMENT | ShapeFlags.ARRAY_CHILDREN
    );
    expect(vnode.children?.length).toBe(3);
    expect((vnode.children?.at(0) as VNode).type).toBe('span');
    expect((vnode.children?.at(1) as VNode).props.class).toBe('red');
    expect((vnode.children?.at(2) as VNode).children).toBe('three');
  });
});
