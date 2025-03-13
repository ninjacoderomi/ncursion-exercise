'use strict';
class ComplexNumber {
    constructor(real, imaginary) {
        this.real = real;
        this.imaginary = imaginary;
    }
    toString() {
        return `${this.real} + ${this.imaginary}i[~${this.toRealNumber()}]`;
    }
    square() {
        const real = this.real * this.real - this.imaginary * this.imaginary;
        const imaginary = 2 * this.real * this.imaginary;
        return new ComplexNumber(real, imaginary);
    }
    add(other) {
        const real = this.real + other.real;
        const imaginary = this.imaginary + other.imaginary;
        return new ComplexNumber(real, imaginary);
    }
    toRealNumber() {
        return Math.sqrt(this.real * this.real + this.imaginary * this.imaginary);
    }
}
const isUnbounded = (x, y, threshold=2, pointsToGenerate=100) => {
    const c =  new ComplexNumber(x,y);
    if(Math.abs(c.toRealNumber()) > threshold){
        return true;
    }
    let zPrev = c;
    for (let i = 1; i < pointsToGenerate; i++) {
        const z = zPrev.square().add(c)
        const diff = z.toRealNumber() - zPrev.toRealNumber();
        if( !Number.isFinite(diff)){
            return true;
        }
        zPrev = z;
    }
    
    return false;
     
}   
 
const renderGrid = ($canvas, {segments, xOffset, yOffset,start, end, threshold, pointsToGenerate, color}) => {
    const ctx = $canvas.getContext('2d');
    const width = $canvas.width - xOffset;
    const cellSizeX = width / segments;
    const xStep = (end - start) / segments;
    const yStep = (end - start) / segments;
    const pArray = [];
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < segments; j++) {
            const x = j * xStep+start;
            const y = i * yStep + start;
            const left = j * cellSizeX + xOffset;
            const top = i * cellSizeX + yOffset;
            const p = new Promise((resolve) => {
                queueMicrotask(() => {
                    if(isUnbounded(x,y, threshold, pointsToGenerate)){
                        ctx.fillStyle = color;
                        ctx.fillRect(left, top, cellSizeX, cellSizeX);
                    }  
                    resolve(i*segments+j);
                 })
            })
            pArray.push(p);
        }
    }
    return Promise.all(pArray);
}
const renderSegmentLabels = ($canvas, { min, max, steps, xOffset, yOffset }) => {
    const ctx = $canvas.getContext('2d');
    const width = $canvas.width;
    const height = $canvas.height;
    const cellSizeX = width / steps;
    const cellSizeY = height / steps;
    const increment = (max - min) / steps;
    const textSize = 10;
    ctx.font = `${textSize}px Arial`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    
    for (let i = 0; i <= steps; i++) {
        const value = min + (increment * i);
        const roundedValue = Math.round(value * 100) / 100; 
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(roundedValue, xOffset - textSize, i * cellSizeY + yOffset);
        ctx.strokeRect(xOffset-5, i * cellSizeY + yOffset, 5, 1);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(roundedValue, i * cellSizeX + xOffset, yOffset - textSize);
        ctx.strokeRect(i * cellSizeX + xOffset, yOffset-5, 1, 5);
    }
}
const renderAxes = ($canvas, {segments, min, max, xOffset, yOffset}) => {
    const ctx = $canvas.getContext('2d');
    const width = $canvas.width;
    const height = $canvas.height;
    ctx.fillRect(xOffset, yOffset, width-xOffset, height-yOffset);
    renderSegmentLabels($canvas, {segments, min, max,steps: 10, xOffset, yOffset});
}
const renderVisualization = ($canvas) => {
    const config = getConfig();
    const { size, gap, segments, min, max, threshold, pointsToGenerate , darkColor, lightColor } = config;
    const canvasSize = size + gap;
    $canvas.width = canvasSize;
    $canvas.height = canvasSize;
    const ctx = $canvas.getContext('2d')
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    renderAxes($canvas,{ segments, min, max, xOffset: gap, yOffset: gap });
    return renderGrid($canvas,{segments, xOffset: gap, yOffset: gap, start:min, end:max, threshold, pointsToGenerate, color: darkColor });
}

const getConfig = () => {
    const config = {
        size: 2000,
        gap: 30,
        segments: 500,
        min: -2,
        max: 2,
        // not a math wizard but I played with values different values and anything above 2 increases exponentially 
        // theoretically anything above 1 should grow unbounded..but do see bounded values between 1 & 2
        threshold: document.getElementById('threshold').value || 2, 
        pointsToGenerate: document.getElementById('points-to-generate').value || 100,
        darkColor: document.getElementById('bounded_color').value || '#000000',
        lightColor: document.getElementById('unbounded_color').value || '#ffffff',
    }
    return config;
}
// everything above this would be functions used below
// since I wanted this to be locally runnable without a server, not using modules

(function() {
    document.getElementById('threshold').addEventListener('input', (e) => {
        document.getElementById('threshold_label').innerText = `Threshold: ${e.target.value}`;
    })
    const $canvas = document.getElementById('canvas-visualization');
    const $form = document.getElementById('settings-form');
    const updateSubmitButton = () => {
        const $button = $form.querySelector('button');
        $button.disabled = false;
        $button.innerText = 'Render';
    }
    const disableSubmitButton = () => {
        const $button = $form.querySelector('button');
        $button.disabled = true;
        $button.innerText = 'Rendering...';
    }

    $form.addEventListener('submit', (e) => {
        e.preventDefault();
        disableSubmitButton();
        renderVisualization($canvas).then(() => {
            updateSubmitButton();
        });
    })

    renderVisualization($canvas);
})() // good old IEFE so that we dont have to worry about global scope variables
