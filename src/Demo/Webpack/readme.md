# 实现原理

## js隔离

目标：
- 隔离cookie/localstorage
- 隔离全局变量、timeout
- 隔离事件
- 隔离history，location

方法：
1、通过new iframe取出contentWindow，然后通过Proxy限制能只能操作沙箱
限制： 只有同域才能取出（或者about:blank, 会影响history不能被操作，只能改为hash模式)
2、然后打包的时候（或者运行时拼接这一段代码）给子应用代码包一层闭包，传进去模拟的window、document对象等


## css隔离

方法：
- css module(业务组件）/css namespace（公共库构建时自动处理）。 限制： 嵌套子应用样式优先级
- 动态css: 切换时会卸载样式，弹窗和样式文件之类的都挂在微应用容器下。 限制：无法兼容多子应用同时运行；框架本身的样式可能会冲突，比如基于next组件的；
- shadow dom

