/**
 * Created by WebStorm.
 * User: darylcecile
 * Date: 15/05/2022
 * Time: 13:50
 * License: MIT
 */

function countInstances(string, word) {
	return string.split(word).length - 1;
}

const code = document.getElementById('user-code').innerText;

describe("must have at least 5 frames", ()=>{
	expect(countInstances(code, 'new frame')).to.be.above(4);
});

describe("framerate must not exceed 30 FPS", ()=>{
	const fps = code.split('\n')
		.filter(line => line.trim().startsWith('config fps'))?.[0]?.toLowerCase()
		.split('config fps')[1] ?? '1';
	expect(parseFloat(fps)).to.be.below(31)
});
