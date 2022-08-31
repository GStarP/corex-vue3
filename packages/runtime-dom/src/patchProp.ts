import { isOn } from '../../shared/src';
import { patchAttr } from './modules/attrs';
import { patchClass } from './modules/class';
import { patchEvent } from './modules/events';
import { patchStyle } from './modules/style';

export const patchProp = (el: Element, key: string, preValue, nextValue) => {
  if (key === 'class') {
    patchClass(el, nextValue);
  } else if (key === 'style') {
    patchStyle(el, preValue, nextValue);
  } else if (isOn(key)) {
    patchEvent(el, key, preValue, nextValue);
  } else {
    // @IGNORE 部分 props 需要特殊处理，这里省去
    patchAttr(el, key, nextValue);
  }
};
