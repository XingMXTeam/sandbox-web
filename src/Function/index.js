// 使用 acorn 库进行 AST 解析的方式增强沙箱安全性

const acorn = require('acorn');

function runInSandBox(code, sandbox) {
  sandbox = sandbox || Object.create(null);

  // 使用 acorn 解析代码以获取抽象语法树（AST）
  const ast = acorn.parse(code, { ecmaVersion: 2020 });

  // 遍历 AST 并检查任何不安全的操作
  function traverse(node) {
    if (node.type === 'Identifier' && !sandbox[node.name]) {
      throw new Error(`未经授权访问 ${node.name}`);
    }
    acorn.walk.simple(node, {
      MemberExpression(child) {
        if (child.object.type === 'Identifier' && !sandbox[child.object.name]) {
          throw new Error(`未经授权访问 ${child.object.name}`);
        }
      }
    });
  }

  // 遍历 AST
  acorn.walk.simple(ast, {
    enter: traverse
  });

  // 在沙箱上下文中执行代码
  const fn = new Function('sandbox', `with(sandbox){return (${code})}`);
  const proxy = new Proxy(sandbox, {
    has(target, key) {
      return true;
    }
  });
  return fn(proxy);
}

// 示例用法
const sandbox = { a: 1, b: 2 };
const result = runInSandBox('a + b', sandbox);
console.log(result); // 输出: 3
