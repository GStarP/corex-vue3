import {
  ConstantTypes,
  ElementNode,
  ElementTypes,
  NodeTypes
} from '../src/ast';
import { baseParse } from '../src/parse';

// 解析模块测试
describe('compiler: parse', () => {
  // 测试一：简单元素
  test('simple element', () => {
    const ast = baseParse('<div>hello</div>');
    const element = ast.children[0];

    expect(element).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: 'div',
      tagType: ElementTypes.ELEMENT,
      props: [],
      children: [
        {
          type: NodeTypes.TEXT,
          content: 'hello',
          loc: {
            start: { offset: 5, line: 1, column: 6 },
            end: { offset: 10, line: 1, column: 11 },
            source: 'hello'
          }
        }
      ],
      loc: {
        start: { offset: 0, line: 1, column: 1 },
        end: { offset: 16, line: 1, column: 17 },
        source: '<div>hello</div>'
      }
    });
  });
  // 测试二：插值元素
  test('interpolation element', () => {
    const ast = baseParse('<div>{{msg}}</div>');
    const element = ast.children[0];

    expect(element).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: 'div',
      tagType: ElementTypes.ELEMENT,
      props: [],
      children: [
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'msg',
            isStatic: false,
            constType: ConstantTypes.NOT_CONSTANT,
            loc: {
              start: { offset: 7, line: 1, column: 8 },
              end: { offset: 10, line: 1, column: 11 },
              source: 'msg'
            }
          },
          loc: {
            start: { offset: 5, line: 1, column: 6 },
            end: { offset: 12, line: 1, column: 13 },
            source: '{{msg}}'
          }
        }
      ],
      loc: {
        start: { offset: 0, line: 1, column: 1 },
        end: { offset: 18, line: 1, column: 19 },
        source: '<div>{{msg}}</div>'
      }
    });
  });
  // 测试三：多个属性（以双引号赋值）
  test('multiple attributes', () => {
    const ast = baseParse('<div id="app" class="wrapper"></div>');
    const element = ast.children[0];

    expect(element).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: 'div',
      tagType: ElementTypes.ELEMENT,
      props: [
        {
          type: NodeTypes.ATTRIBUTE,
          name: 'id',
          value: {
            type: NodeTypes.TEXT,
            content: 'app',
            loc: {
              start: { offset: 8, line: 1, column: 9 },
              end: { offset: 13, line: 1, column: 14 },
              source: '"app"'
            }
          },
          loc: {
            start: { offset: 5, line: 1, column: 6 },
            end: { offset: 13, line: 1, column: 14 },
            source: 'id="app"'
          }
        },
        {
          type: NodeTypes.ATTRIBUTE,
          name: 'class',
          value: {
            type: NodeTypes.TEXT,
            content: 'wrapper',
            loc: {
              start: { offset: 20, line: 1, column: 21 },
              end: { offset: 29, line: 1, column: 30 },
              source: '"wrapper"'
            }
          },
          loc: {
            start: { offset: 14, line: 1, column: 15 },
            end: { offset: 29, line: 1, column: 30 },
            source: 'class="wrapper"'
          }
        }
      ],
      children: [],
      loc: {
        start: { offset: 0, line: 1, column: 1 },
        end: { offset: 36, line: 1, column: 37 },
        source: '<div id="app" class="wrapper"></div>'
      }
    });
  });
  // 测试四：简写 v-bind 绑定属性
  test('v-bind shorthand', () => {
    const ast = baseParse('<div :class="cls"></div>');
    const directive = (ast.children[0] as ElementNode).props[0];

    expect(directive).toStrictEqual({
      type: NodeTypes.DIRECTIVE,
      name: 'bind',
      arg: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: 'class',
        isStatic: true,
        constType: ConstantTypes.CAN_STRINGIFY,
        loc: {
          source: 'class',
          start: {
            offset: 6,
            line: 1,
            column: 7
          },
          end: {
            offset: 11,
            line: 1,
            column: 12
          }
        }
      },
      exp: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: 'cls',
        isStatic: false,
        constType: ConstantTypes.NOT_CONSTANT,
        loc: {
          start: { offset: 13, line: 1, column: 14 },
          end: { offset: 16, line: 1, column: 17 },
          source: 'cls'
        }
      },
      loc: {
        start: { offset: 5, line: 1, column: 6 },
        end: { offset: 17, line: 1, column: 18 },
        source: ':class="cls"'
      }
    });
  });
  // 测试五：综合测试
  test('nested element, text + interpolation', () => {
    const html =
      '<App id="app">' +
      '\n' +
      '  <h1 :class="cls">Hello {{name}}</h1>' +
      '\n' +
      '  <button :onClick="toggleCls"></button>' +
      '\n' +
      '</App>';
    const ast = baseParse(html);
    const app = ast.children[0];

    expect(app).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: 'App',
      tagType: ElementTypes.COMPONENT,
      props: [
        {
          type: NodeTypes.ATTRIBUTE,
          name: 'id',
          value: {
            type: NodeTypes.TEXT,
            content: 'app',
            loc: {
              start: { offset: 8, line: 1, column: 9 },
              end: { offset: 13, line: 1, column: 14 },
              source: '"app"'
            }
          },
          loc: {
            start: { offset: 5, line: 1, column: 6 },
            end: { offset: 13, line: 1, column: 14 },
            source: 'id="app"'
          }
        }
      ],
      children: [
        {
          type: NodeTypes.ELEMENT,
          tag: 'h1',
          tagType: ElementTypes.ELEMENT,
          props: [
            {
              type: NodeTypes.DIRECTIVE,
              name: 'bind',
              arg: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: 'class',
                isStatic: true,
                constType: ConstantTypes.CAN_STRINGIFY,
                loc: {
                  start: { offset: 22, line: 2, column: 8 },
                  end: { offset: 27, line: 2, column: 13 },
                  source: 'class'
                }
              },
              exp: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: 'cls',
                isStatic: false,
                constType: ConstantTypes.NOT_CONSTANT,
                loc: {
                  start: { offset: 29, line: 2, column: 15 },
                  end: { offset: 32, line: 2, column: 18 },
                  source: 'cls'
                }
              },
              loc: {
                start: { offset: 21, line: 2, column: 7 },
                end: { offset: 33, line: 2, column: 19 },
                source: ':class="cls"'
              }
            }
          ],
          children: [
            {
              type: NodeTypes.TEXT,
              content: 'Hello ',
              loc: {
                start: { offset: 34, line: 2, column: 20 },
                end: { offset: 40, line: 2, column: 26 },
                source: 'Hello '
              }
            },
            {
              type: NodeTypes.INTERPOLATION,
              content: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: 'name',
                isStatic: false,
                constType: ConstantTypes.NOT_CONSTANT,
                loc: {
                  start: { offset: 42, line: 2, column: 28 },
                  end: { offset: 46, line: 2, column: 32 },
                  source: 'name'
                }
              },
              loc: {
                start: { offset: 40, line: 2, column: 26 },
                end: { offset: 48, line: 2, column: 34 },
                source: '{{name}}'
              }
            }
          ],
          loc: {
            start: { offset: 17, line: 2, column: 3 },
            end: { offset: 53, line: 2, column: 39 },
            source: '<h1 :class="cls">Hello {{name}}</h1>'
          }
        },
        {
          type: NodeTypes.ELEMENT,
          tag: 'button',
          tagType: ElementTypes.ELEMENT,
          props: [
            // TODO 暂时不考虑 directive-on
            {
              type: NodeTypes.DIRECTIVE,
              name: 'bind',
              arg: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: 'onClick',
                isStatic: true,
                constType: ConstantTypes.CAN_STRINGIFY,
                loc: {
                  start: { offset: 65, line: 3, column: 12 },
                  end: { offset: 72, line: 3, column: 19 },
                  source: 'onClick'
                }
              },
              exp: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: 'toggleCls',
                isStatic: false,
                constType: ConstantTypes.NOT_CONSTANT,
                loc: {
                  start: { offset: 74, line: 3, column: 21 },
                  end: { offset: 83, line: 3, column: 30 },
                  source: 'toggleCls'
                }
              },
              loc: {
                start: { offset: 64, line: 3, column: 11 },
                end: { offset: 84, line: 3, column: 31 },
                source: ':onClick="toggleCls"'
              }
            }
          ],
          children: [],
          loc: {
            start: { offset: 56, line: 3, column: 3 },
            end: { offset: 94, line: 3, column: 41 },
            source: '<button :onClick="toggleCls"></button>'
          }
        }
      ],
      loc: {
        start: { offset: 0, line: 1, column: 1 },
        end: { offset: 101, line: 4, column: 7 },
        source: html
      }
    });
  });
});
