# eval、Function、with的区别

## eval和正常的代码权限一致

```js
var b = 456;
function compileCode (src) {
  var b=123;
  src = 'var a = 12;this.console.log(b)' // 123
  return eval(src)
}
compileCode()
```

```js
// 直接使用 eval
eval(code);  // eval 的 this 指向当前作用域，比如window

// 在严格模式下，直接调用 eval 会使用当前作用域的 this
'use strict';
eval('console.log(this)');  // this 指向 undefined 或当前作用域

// (0,eval)
function test() {
    const x = 1;
    
    // 直接调用 eval 时，JavaScript 引擎会特殊处理
    // 允许 eval 访问当前作用域的变量
    eval('console.log(x)');  // 可以访问到 x
    
    // 当通过引用调用 eval 时（包括 (0,eval)）
    // JavaScript 引擎不会特殊处理
    // 此时 eval 就像一个普通函数
    // 只能访问全局作用域的变量
    (0,eval)('console.log(x)');  // 无法访问到 x  
    // 可以确保获取到真正的全局对象，而不是闭包中的 window
    (0,eval)('window')

}
```

## Function

```js
var b = 456;
function compileCode (src) {
  var b=123; // 无法被访问（new Function没有创建闭包）
  src = 'var a = 12;this.console.log(b)' // 456
  return new Function('sandbox', src)
}
compileCode()()
```

```js
/**
 *  // Function to create a sandbox environment using new Function
 * function createSandbox() {
 *     // Define a simple sandbox context with limited access
 *     const sandboxContext = {
 *         console: {
 *             log: console.log // Allowing only console.log
 *         }
 *     };
 *
 *     // Create a new Function within the sandbox context
 *     const sandboxFunction = new Function('console', 'return function() { console.log("This is executed in the sandbox"); }')(sandboxContext.console);
 *
 *     return sandboxFunction;
 * }
 *
 * // Example usage
 * const sandbox = createSandbox();
 * sandbox(); // This will log "This is executed in the sandbox"
 *
 * @param code
 * @param sandbox
 * @return {*|boolean}
 */
function runInSandBox(code,sandbox) {
  sandbox = sandbox || Object.create(null);
  // 用with唯一区别是作用域： 可以直接访问属性
  // runInSandBox(`this.console.log(a)`, {a: 123}) 可以直接访问a
  const fn = new Function('sandbox', `with(sandbox){return (${code})}`);
  const proxy = new Proxy(sandbox, {
    has(target, key) {
      // 让动态执行的代码认为属性已存在
      return true;
    }
  });
  return fn(proxy);
}
```

```js
// 下面是一个示例，演示了如何绕过使用代理创建的沙箱：

// 恶意代码尝试绕过沙箱
const maliciousCode = 'this.console.log(this.xxx)';

// 沙箱对象
const sandbox = { a: 1, b: 2 };

var xxx = 123;

// 尝试绕过沙箱
const result = runInSandBox(maliciousCode, sandbox);
console.log(result); // 123 恶意代码成功绕过了沙箱，访问了全局对象
```
