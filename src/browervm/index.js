// safari unpredictably lists some new globals first or second in object order
let firstGlobalProp, secondGlobalProp, lastGlobalProp;

export function noteGlobalProps(global) {
	// alternatively Object.keys(global).pop()
	// but this may be faster (pending benchmarks)
	firstGlobalProp = secondGlobalProp = undefined;

	for (let p in global) {
		if (shouldSkipProperty(global, p))
			continue;
		if (!firstGlobalProp)
			firstGlobalProp = p;
		else if (!secondGlobalProp)
			secondGlobalProp = p;
		lastGlobalProp = p;
	}

	return lastGlobalProp;
}


export function getGlobalProp(global) {
	let cnt = 0;
	let lastProp;
	let hasIframe = false;

	for (let p in global) {
		if (shouldSkipProperty(global, p))
			continue;

		// 遍历 iframe，检查 window 上的属性值是否是 iframe，是则跳过后面的 first 和 second 判断
		for (let i = 0; i < window.frames.length && !hasIframe; i++) {
			const frame = window.frames[i];
			if (frame === global[p]) {
				hasIframe = true;
				break;
			}
		}

		if (!hasIframe && (cnt === 0 && p !== firstGlobalProp || cnt === 1 && p !== secondGlobalProp))
			return p;
		cnt++;
		lastProp = p;
	}

	if (lastProp !== lastGlobalProp)
		return lastProp;
}

noteGlobalProps(window)
const a = getGlobalProp(window)
console.log(a)

// 通过上面两个方法，可以获取挂载到全局对象上的导出对象

// 为什么不用`import` ?

// 1、只能加载 ES Module，无法处理其他类型的脚本
// 2、多应用间的隔离、沙箱环境，上面的方案更加通用


