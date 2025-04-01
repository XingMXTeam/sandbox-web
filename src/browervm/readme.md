## 如何获取微应用导出对象 

见index.js


## 如何通过沙箱执行代码

1、通过下面的方式包裹js代码，然后通过(0,eval)(code) 执行
```js

`;(function(window, self, globalThis){ // 确保window, self, globalThis都指向window.proxy代理
    with(window){ // 严格模式需要with包裹，非严格模式不需要
        ;${scriptText}\n${sourceUrl}
    }
}).bind(window.proxy)(window.proxy, window.proxy, window.proxy);` // 通过bind确保this也指向window.proxy代理

```

什么是严格模式？这里是自定义的概念，要区别'use strict'

```js
// 假设我们有这样的脚本
const scriptText = `
    console.log(window.foo);  // 访问全局变量
    console.log(this.foo);    // 访问this
    console.log(foo);         // 直接访问变量
`;

// 创建一个代理对象
const proxy = {
    foo: 'bar',
    console: window.console
};
```

非严格模式下：

```js
// 执行结果
console.log(window.foo);  // 'bar' - 通过window.proxy访问
console.log(this.foo);    // 'bar' - 通过this访问
console.log(foo);         // undefined - 直接访问失败
```

严格模式： 
```js
// 执行结果
console.log(window.foo);  // 'bar' - 通过window.proxy访问
console.log(this.foo);    // 'bar' - 通过this访问
console.log(foo);         // 'bar' - 通过with(window)访问
```

## qianku如何创建一个沙箱


```js
// 1. 首先定义沙箱接口
interface SandBox {
  active(): void;
  inactive(): void;
  proxy: Window;
}

// 2. 实现一个简单的 Proxy 沙箱
class SimpleProxySandbox implements SandBox {
  private addedPropsMap = new Map<PropertyKey, any>();
  private modifiedPropsOriginalValueMap = new Map<PropertyKey, any>();
  private currentUpdatedPropsValueMap = new Map<PropertyKey, any>();
  public proxy: Window;
  private sandboxRunning = true;

  constructor() {
    // 创建一个假的 window 对象
    const fakeWindow = Object.create(null);
    
    // 使用 Proxy 代理 window 对象
    this.proxy = new Proxy(fakeWindow, {
      set: (target: Window, prop: PropertyKey, value: any) => {
        if (this.sandboxRunning) {
          // 记录新增的属性
          if (!window.hasOwnProperty(prop)) {
            this.addedPropsMap.set(prop, value);
          } else if (!this.modifiedPropsOriginalValueMap.has(prop)) {
            // 记录修改前的原始值
            this.modifiedPropsOriginalValueMap.set(prop, window[prop as keyof Window]);
          }
          
          // 更新当前值
          this.currentUpdatedPropsValueMap.set(prop, value);
          
          // 同步到真实的 window 对象
          (window as any)[prop] = value;
        }
        return true;
      },
      get: (target: Window, prop: PropertyKey) => {
        // 优先从沙箱中获取
        if (this.currentUpdatedPropsValueMap.has(prop)) {
          return this.currentUpdatedPropsValueMap.get(prop);
        }
        // 否则从真实的 window 中获取
        return window[prop as keyof Window];
      }
    });
  }

  active() {
    this.sandboxRunning = true;
    // 恢复沙箱中的状态
    this.currentUpdatedPropsValueMap.forEach((value, prop) => {
      (window as any)[prop] = value;
    });
  }

  inactive() {
    this.sandboxRunning = false;
    // 恢复原始状态
    this.modifiedPropsOriginalValueMap.forEach((value, prop) => {
      (window as any)[prop] = value;
    });
    // 删除新增的属性
    this.addedPropsMap.forEach((_, prop) => {
      delete (window as any)[prop];
    });
  }
}

// 3. 使用示例
function demo() {
  // 创建沙箱实例
  const sandbox = new SimpleProxySandbox();
  
  // 激活沙箱
  sandbox.active();
  
  // 在沙箱环境中执行代码
  const sandboxWindow = sandbox.proxy;
  
  // 修改全局变量
  sandboxWindow.testVar = 'test value';
  sandboxWindow.counter = 0;
  
  console.log('沙箱中的值:', sandboxWindow.testVar); // 'test value'
  console.log('真实 window 中的值:', window.testVar); // 'test value'
  
  // 停用沙箱
  sandbox.inactive();
  
  // 检查值是否被恢复
  console.log('停用后真实 window 中的值:', window.testVar); // undefined
}

// 4. 运行多个沙箱的示例
function multipleSandboxesDemo() {
  // 创建两个沙箱
  const sandbox1 = new SimpleProxySandbox();
  const sandbox2 = new SimpleProxySandbox();
  
  // 激活第一个沙箱
  sandbox1.active();
  sandbox1.proxy.appName = 'App1';
  console.log('App1 中的 appName:', sandbox1.proxy.appName); // 'App1'
  sandbox1.inactive();
  
  // 激活第二个沙箱
  sandbox2.active();
  sandbox2.proxy.appName = 'App2';
  console.log('App2 中的 appName:', sandbox2.proxy.appName); // 'App2'
  sandbox2.inactive();
  
  // 检查全局环境
  console.log('全局环境中的 appName:', window.appName); // undefined
}

// 运行示例
console.log('=== 单个沙箱示例 ===');
demo();

console.log('\n=== 多个沙箱示例 ===');
multipleSandboxesDemo();

```