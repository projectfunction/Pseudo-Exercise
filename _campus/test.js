/**
 * Created by WebStorm.
 * User: darylcecile
 * Date: 15/05/2022
 * Time: 13:50
 * License: MIT
 */

describe("must have at least 5 frames", ()=>{
	expect(frameInstructions).to.be.above(4);
});

describe("framerate must not exceed 30 FPS", ()=>{
	expect(framesPerSecond).to.be.below(31)
});