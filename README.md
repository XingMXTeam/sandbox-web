# 实现原理

## js隔离

目标：
- 隔离cookie/localstorage
- 隔离全局变量、timeout
- 隔离事件
- 隔离history，location

方法：

### iframe 隔离
1、通过new iframe取出contentWindow，然后通过Proxy限制能只能操作沙箱
限制： 只有同域才能取出（或者about:blank, 会影响history不能被操作，只能改为hash模式)
2、然后打包的时候（或者运行时拼接这一段代码）给子应用代码包一层闭包，传进去模拟的window、document对象等
```js
class MicroApp {
    constructor(name) {
        this.name = name;
        this.iframe = null;
    }

    // 创建沙箱环境
    createSandbox() {
        // 1. 创建 iframe 作为隔离环境
        this.iframe = document.createElement('iframe');
        this.iframe.style.display = 'none';
        document.body.appendChild(this.iframe);
        
        // 2. 获取 iframe 的 contentWindow
        const sandboxWindow = this.iframe.contentWindow;
        
        // 3. 创建代理来限制访问
        const sandboxProxy = new Proxy(sandboxWindow, {
            get(target, prop) {
                // 只允许访问安全的属性
                const safeProps = ['document', 'location', 'history'];
                if (safeProps.includes(prop)) {
                    return target[prop];
                }
                return undefined;
            }
        });

        return sandboxProxy;
    }

    // 加载子应用
    loadApp(appCode) {
        // 1. 确保有沙箱环境
        const sandbox = this.createSandbox();
        
        // 2. 包装代码，确保在沙箱环境中运行
        const wrappedCode = `
            (function(window) {
                // 子应用代码
                ${appCode}
            })(window);
        `;

        // 3. 在沙箱中执行代码
        sandbox.eval(wrappedCode);
    }
}

// 使用示例
const microApp = new MicroApp('myApp');

// 子应用代码
const appCode = `
    // 这里的代码会在 iframe 的沙箱环境中运行
    const element = document.createElement('div');
    element.setAttribute('class', 'my-component');
    
    // 这里的 localStorage 是 iframe 中的 localStorage
    localStorage.setItem('myKey', 'myValue');
    
    // 这里的 setTimeout 是 iframe 中的 setTimeout
    setTimeout(() => {
        console.log('Timeout in sandbox');
    }, 1000);
`;

microApp.loadApp(appCode);
```

### Function + AST + proxy

### fake window + proxy


## css隔离

方法：
- css module(业务组件）/css namespace（公共库构建时自动处理）。 限制： 嵌套子应用样式优先级
- 动态css: 切换时会卸载样式，弹窗和样式文件之类的都挂在微应用容器下。 限制：无法兼容多子应用同时运行；框架本身的样式可能会冲突，比如基于next组件的
- shadow dom

