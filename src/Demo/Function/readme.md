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
