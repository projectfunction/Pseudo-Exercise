
/** @var {HTMLCanvasElement} */
const canvas = document.getElementById('main-canvas');
const canvasContainer = document.getElementById('canvas-container');
const code = document.getElementById('user-code');
const DPI = window.devicePixelRatio;

// create rendering context - we use this to draw to the canvas;
const drawingContext = canvas.getContext("2d");

window.frameInstructions = [];
window.framesPerSecond = 1;
window.currentFrameIndex = 0;
window.canvasVars = {};
window.meta = { envReady: false };

function resetCanvasSize(){
    const canvasContainerStyles = window.getComputedStyle(canvasContainer);
    const width = parseInt(canvasContainerStyles.width);
    const height = parseInt(canvasContainerStyles.height);

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
}

function renderFrames(){
    if (window.frameInstructions.length > 0){
        if (window.currentFrameIndex + 1 >= window.frameInstructions.length) window.currentFrameIndex = 0;
        else window.currentFrameIndex ++;

        const canvasVariables = window.canvasVars;

        let lines = window.frameInstructions[window.currentFrameIndex];

        triggerEvent('PSEUDO', {stage:'beforeRun', variables:takeSnapshot(canvasVariables)});

        for (let line of lines) {
            line = line.trim().split('//')[0].replace(/;/, '');

            triggerEvent('PSEUDO', {stage:'beforeLine', variables:takeSnapshot(canvasVariables)});

            const wordsInLine = line.toLowerCase().split(" ");

            const [instruction, target, ...values] = wordsInLine;
            const value = normalizeValue(values.join(' '));

            triggerEvent('PSEUDO', {
                stage:'instruction',
                variables:takeSnapshot(canvasVariables),
                instruction,
                target,
                value,
            });

            drawingContext.save();

            if (instruction.length === 0){
                triggerEvent('PSEUDO', {
                    stage:'instruction:blank',
                    variables:takeSnapshot(canvasVariables)
                });
                continue;
            }
            else if (instruction === 'set' && target === 'position') {
                const [x, y] = value.split(/[, ]/);
                const parsedX = Number(x);
                const parsedY = Number(y);

                canvasVariables['x'] = isNaN(parsedX) ? x : parsedX;
                canvasVariables['y'] = isNaN(parsedY) ? y : parsedY;
            }
            else if (instruction === 'set' && target === 'size') {
                const [w, h] = value.split(/[, ]/);
                const parsedW = Number(w);
                const parsedH = Number(h);

                canvasVariables['width'] = isNaN(parsedW) ? w : parsedW;
                canvasVariables['height'] = isNaN(parsedH) ? h : parsedH;
            }
            else if (instruction === 'set'){
                const parsedValue = Number(value);
                canvasVariables[target] = isNaN(parsedValue) ? value : parsedValue;
            }
            else if (instruction === 'clear' && target === 'all'){
                // clear the entire canvas
                drawingContext.clearRect(0, 0, canvas.width, canvas.height);
            }
            else if (instruction === 'clear' && target === 'selection'){
                drawingContext.clearRect(
                    normalizeAmount(canvasVariables.x),
                    normalizeAmount(canvasVariables.y),
                    normalizeAmount(canvasVariables.width),
                    normalizeAmount(canvasVariables.height)
                );
            }
            else if (instruction === 'paint' && target === 'all'){
                drawingContext.fillStyle = value;
                drawingContext.fillRect(0, 0, canvas.width, canvas.height);
            }
            else if (instruction === 'paint' && target === 'selection'){
                drawingContext.fillStyle = value;
                drawingContext.fillRect(
                    normalizeAmount(canvasVariables.x),
                    normalizeAmount(canvasVariables.y),
                    normalizeAmount(canvasVariables.width),
                    normalizeAmount(canvasVariables.height)
                );
            }
            else if (instruction === 'outline' && target === 'selection'){
                drawingContext.strokeStyle = value;
                drawingContext.strokeRect(
                    normalizeAmount(canvasVariables.x),
                    normalizeAmount(canvasVariables.y),
                    normalizeAmount(canvasVariables.width),
                    normalizeAmount(canvasVariables.height)
                );
            }

            drawingContext.restore();

            triggerEvent('PSEUDO', {stage:'afterLine', variables:takeSnapshot(canvasVariables)});
        }

        triggerEvent('PSEUDO', {stage:'afterRun', variables:takeSnapshot(canvasVariables)});

    }
    startAnimation();
}

function startAnimation(){
    setTimeout(renderFrames, 1000 / window.framesPerSecond)
}

function updateCanvasFrames(){
    // clear the entire canvas
    drawingContext.clearRect(0, 0, canvas.width, canvas.height);

    const { canvasVariables, frames } = convertUserInputToDrawingInstructions(code.innerText);

    window.canvasVars = canvasVariables;
    window.frameInstructions = frames;
    window.framesPerSecond = canvasVariables.fps;

    document.getElementById('fps-indicator').innerText = `${canvasVariables.fps} FPS`;
}

function normalizeAmount(amount){
    if (amount.toString().trim().endsWith("%")){
        return (canvas.width / 100) * parseInt(amount)
    }
    let fixed = amount / DPI;
    return isNaN(fixed) ? amount : fixed;
}

function normalizeValue(value){
    let v = value.trim();
    if (v.startsWith('=')) return v.substring(1).trim();
    return v;
}

function takeSnapshot(content){
    if ('structuredClone' in window){
        return window.structuredClone(content);
    }
    try {
        return JSON.parse(JSON.stringify(content));
    }
    catch (e){
        console.warn('Failed to take snapshot', {error:e, content});
        return content;
    }
}

function triggerEvent(eventName, value){
    window.dispatchEvent(new CustomEvent(eventName, {
        cancelable: false,
        bubbles: true,
        composed: false,
        detail: value
    }));
}

function convertUserInputToDrawingInstructions(userInput) {
    const lines = userInput.split("\n");

    const canvasVariables = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        fps: 1
    };
    const frames = [];

    triggerEvent('PSEUDO', {stage:'beforeParseFrames', variables:takeSnapshot(canvasVariables)});

    let currentFrameIndex = 0;

    for (let line of lines) {
        line = line.trim().split('//')[0];
        const wordsInLine = line.toLowerCase().split(" ");

        const [instruction, target, ...values] = wordsInLine;
        const value = values.join(' ').trim();

        if (instruction === 'new' && target === 'frame'){
            currentFrameIndex ++;
        }
        else if (instruction === 'config' && target === 'fps'){
            const parsedValue = Number(value);
            canvasVariables[target] = isNaN(parsedValue) ? value : parsedValue;
        }
        else {
            if (!frames[currentFrameIndex]) frames[currentFrameIndex] = [];
            frames[currentFrameIndex].push(line);
        }
    }

    triggerEvent('PSEUDO', {stage:'afterParseFrames', variables:takeSnapshot(canvasVariables)});

    return {
        canvasVariables,
        frames
    }
}

// listen for window resize so we can update the canvas size
window.addEventListener('resize', resetCanvasSize);

// start off by immediately setting canvas size
resetCanvasSize();

startAnimation();

updateCanvasFrames();