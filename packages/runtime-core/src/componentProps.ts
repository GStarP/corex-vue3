import { ComponentInternalInstance } from './component';

export function initProps(instance: ComponentInternalInstance, rawProps) {
  // @IGNORE 暂不支持 props，直接全部当成 attrs
  const attrs = {};
  for (let key in rawProps) {
    attrs[key] = rawProps[key];
  }
  instance.attrs = attrs;
}
