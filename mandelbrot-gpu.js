"use strict";

let gl;  // WebGL "context"
let nt = 1000;
let escape_max;
var mouseDown = false,
mouseX = 0,
mouseY = 0;

window.onload = function init()

{
    const camera = {
        x: 0.0,
        y: 0.0,
        rotation: 0,
        zoom: 1.0,
      };

    let viewProjectionMat;

    let canvas = document.getElementById( "gl-canvas" );
    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available" );

    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    let program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // vertices of the corners of the canvas
    let vertices = [vec2(-1.0, 1.0), vec2(1.0, 1.0), vec2(1.0, -1.0), vec2(-1.0, -1.0)];
    
    
    render(vertices.length);
    

    function projection(width, height) {
        // Note: This matrix flips the Y axis so 0 is at the top.
        return [
            1 , 0, 0,
            0, -1, 0,
            0, 0, 1
        ];
      }

    function transformPoint(m, v) {
        var v0 = v[0];
        var v1 = v[1];
        var d = v0 * m[0 * 3 + 2] + v1 * m[1 * 3 + 2] + m[2 * 3 + 2];

        return [
            (v0 * m[0 * 3 + 0] + v1 * m[1 * 3 + 0] + m[2 * 3 + 0]) / d,
            (v0 * m[0 * 3 + 1] + v1 * m[1 * 3 + 1] + m[2 * 3 + 1]) / d,
        ];
    }

    function makeCameraMatrix() {
        const zoomScale = 1 / camera.zoom;
        let cameraMat = mat3(1, 0, 0, 0, 1, 0, 0, 0, 1);
        cameraMat = mult(cameraMat, translate(camera.x, camera.y));
        cameraMat = mult(cameraMat, rotate(camera.rotation, vec3(0, 0, 1), 3));
        cameraMat = mult(cameraMat, scale(zoomScale, zoomScale));
        return cameraMat;
    }

    function updateViewProjection() {
        // same as ortho(0, width, height, 0, -1, 1)
        const projectionMat = mat3(projection(gl.canvas.width, gl.canvas.height));
        const cameraMat = makeCameraMatrix();
        let viewMat = inverse3(cameraMat);
        viewProjectionMat = mult(projectionMat, viewMat);
    }

    function getClipSpaceMousePosition(e) {
        // get canvas relative css position
        const rect = canvas.getBoundingClientRect();
        const cssX = e.clientX - rect.left;
        const cssY = e.clientY - rect.top;
        
        // get normalized 0 to 1 position across and down canvas
        const normalizedX = cssX / canvas.clientWidth;
        const normalizedY = cssY / canvas.clientHeight;
      
        // convert to clip space
        const clipX = normalizedX *  2 - 1;
        const clipY = normalizedY * -2 + 1;
        
        return [clipX, clipY];
    }
    
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();  
        const [clipX, clipY] = getClipSpaceMousePosition(e);
        // position before zooming
        const [preZoomX, preZoomY] = transformPoint(
            flatten(inverse3(viewProjectionMat)), 
            [clipX, clipY]);
            
        // multiply the wheel movement by the current zoom level
        // so we zoom less when zoomed in and more when zoomed out
        const newZoom = camera.zoom * Math.pow(2, e.deltaY * -0.01);
        camera.zoom = Math.max(0.02, Math.min(1000000000000, newZoom));
    
        updateViewProjection();
        
        // position after zooming
        const [postZoomX, postZoomY] = transformPoint(
            flatten(inverse3(viewProjectionMat)), 
            [clipX, clipY]);
        
        // camera needs to be moved the difference of before and after
        camera.x += preZoomX - postZoomX;
        camera.y += preZoomY - postZoomY;  
        console.log(camera.zoom)
        
        render(vertices.length);
    });
    canvas.addEventListener('mousedown', function (evt) {
        evt.preventDefault();
        mouseDown = true;
        mouseX = evt.clientX;
        mouseY = evt.clientY;
    }, false);
    canvas.addEventListener('mouseup', function (evt) {
        evt.preventDefault();
        mouseDown = false;
    }, false);
    canvas.addEventListener('mousemove', (e) => {
        e.preventDefault();  
    if (!mouseDown) {
        render(vertices.length);
    }
        const [clipX, clipY] = getClipSpaceMousePosition(e);
        // position before zooming
        const [predragx, predragy] = transformPoint(
            flatten(inverse3(viewProjectionMat)), 
            [clipX, clipY]);
            
        const newX = e.offsetX/1000;
        const newY = e.offsetY/1000;
        camera.x = Math.max(-2, Math.min(2, newX));
        camera.y = Math.max(-2, Math.min(2, newY));
    
        updateViewProjection();
        
        render(vertices.length);
    });

    function render(len) {
        mousep=[];
        zx=mouseX;
        zy=mouseY;
        while (i < 50) 
                {
                    //we calculate the square of the complex number (a^2+b^2+2abi),
                    let z = sqr(zx, zy)
                    // increment it to zx, zy and increase escape time variable by 1
                    zx = z[0] + mouseX; 
                    zy = z[1] + mouseY;
                    mousep.push(vec2(zx,zy));
                    i++;
                }    
        // Load the data into the GPU and bind to shader variables.
        gl.bindBuffer( gl.ARRAY_BUFFER, gl.createBuffer() );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
    
        // Associate out shader variables with our data buffer
        let vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );

        gl.bindBuffer( gl.ARRAY_BUFFER, gl.createBuffer() );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(mousep), gl.STATIC_DRAW );
        let vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );
        
        escape_max = gl.getUniformLocation( program, "nt" );
        gl.uniform1i(escape_max, nt);
    
        let matrix = gl.getUniformLocation( program, "matrix" );
        gl.uniformMatrix3fv(matrix, false, [1,0,0,0,1,0,0,0,1]);
    
        let c_zoom = gl.getUniformLocation( program, "c_zoom" );
        gl.uniform1f(c_zoom, camera.zoom);
        
        let c_x = gl.getUniformLocation( program, "c_x" );
        gl.uniform1f(c_x, camera.x);
        
        let c_y = gl.getUniformLocation( program, "c_y" );
        gl.uniform1f(c_y, camera.y);

        updateViewProjection();
        
        gl.clear( gl.COLOR_BUFFER_BIT );
        gl.drawArrays( gl.POINTS, 0, len );
    }
}

function sqr(r,i){
    //computes the square of the vector
    return [Math.pow(r,2) - Math.pow(i,2), 2*r*i] 
}