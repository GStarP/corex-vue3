# corex-vue3

掘金专栏 [【源码瘦身】Vue3](https://juejin.cn/column/7133018658149761054) 的示例代码。

【源码瘦身】系列致力于将处理边缘情况和实现进阶功能的代码除外，抽取核心代码，实现可用的主要功能。 在这个过程中，你能够了解框架的实现原理、学习项目的编码技巧、实现自己的简化框架。

## 如何使用

你可以切换不同分支，关注不同迭代阶段的代码实现：

- `reactivity_base`
  - effect(fn, options)
  - reactive(target)
  - ref(value)
  - computed(fn)
- `renderer_base`
  - h(type, props, children)
  - 渲染 DOM 元素
- `renderer_component`
  - 渲染组件：仅支持 setup(props) 返回渲染函数
- `renderer_reactive`
  - 文本内容响应式
  - 组件自身 props 响应式
  - 父组件设置子组件 props 响应式

我们的变量命名及函数划分与 Vue3 基本一致，建议对照 Vue3 源码进行阅读。

在对照阅读的过程中，你可能会发现一些不同，请关注这些特殊注释：

- @IGNORE：被省略的内容功能如何、为何省略
- @TODO：个人尚未理解的逻辑
