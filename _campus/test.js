/**
 * Created by WebStorm.
 * User: darylcecile
 * Date: 15/05/2022
 * Time: 13:50
 * License: MIT
 */

async function untilReady() {
	let isCancelled = false;
	return new Promise(resolve => {
		let interval = setInterval(()=>{
			if (window.isEnvironmentReady || isCancelled){
				clearInterval(interval);
				resolve();
			}
		}, 200);

		setTimeout(()=>{
			isCancelled = true;
		}, 5_000);
	});
}

await untilReady();

describe("must have at least 5 frames", ()=>{
	expect(window.frameInstructions).to.be.above(4);
});

describe("framerate must not exceed 30 FPS", ()=>{
	expect(window.framesPerSecond).to.be.below(31)
});
