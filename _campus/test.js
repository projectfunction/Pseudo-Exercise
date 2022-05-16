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
		let timeout = setTimeout(()=>{
			if (window.isEnvironmentReady || isCancelled){
				clearTimeout(timeout);
				resolve();
			}
		}, 200);

		setTimeout(()=>{
			isCancelled = true;
		}, 5_000);
	});
}

await describe("must have at least 5 frames", async ()=>{
	await untilReady();
	expect(window.frameInstructions).to.be.above(4);
});

await describe("framerate must not exceed 30 FPS", async ()=>{
	await untilReady();
	expect(window.framesPerSecond).to.be.below(31)
});