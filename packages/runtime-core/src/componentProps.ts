import { EMPTY_OBJ, hasOwn, isArray } from '../../shared/src';
import { ComponentInternalInstance } from './component';

export function normalizePropsOptions(comp) {
  // 组件中定义的 props 选项
  const raw = comp.props;
  // 记录所有 props 名称
  const normalized = {};
  // @IGNORE 只允许 string[] 类型的 props 选项
  if (isArray(raw)) {
    for (let i = 0; i < raw.length; i++) {
      // @IGNORE 规范命名
      const normalizedKey = raw[i];
      // @TODO 可能就是一定要对应一个东西，为了简单就用空对象？
      normalized[normalizedKey] = EMPTY_OBJ;
    }
  } else if (raw) {
    console.error('only support string[] props');
  }
  return normalized;
}

export function initProps(instance: ComponentInternalInstance, rawProps) {
  const props = {};
  const attrs = {};

  setFullProps(instance, rawProps, props, attrs);

  // @IGNORE shallowReactive
  instance.props = props;
  instance.attrs = attrs;
}

function setFullProps(
  instance: ComponentInternalInstance,
  rawProps,
  props,
  attrs
) {
  const options = instance.propsOptions;
  // 记录 attr 是否变更（以后实现更新可能用到）
  let hasAttrsChanged = false;

  if (rawProps) {
    for (let key in rawProps) {
      // @IGNORE 跳过保留属性，如 key、ref 等
      const value = rawProps[key];
      // @IGNORE 规范命名
      if (options && hasOwn(options, key)) {
        props[key] = value;
      } else {
        if (!(key in attrs) || value !== attrs[key]) {
          attrs[key] = value;
          hasAttrsChanged = true;
        }
      }
    }
  }

  return hasAttrsChanged;
}
