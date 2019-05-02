// 点着色器
let VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = a_Position;\n' +
    '  v_Color = a_Color;\n' +
    '}\n';

// 片着色器
let FSHADER_SOURCE =
    'precision mediump float;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

const NUMPOINTS = vertex_pos.length;//顶点数目
const NUMPOLYGON = polygon.length;//四边形数目
const NUMTRIANGLES = NUMPOLYGON * 2;
const CENTER = {x: canvasSize.maxX / 2, y: canvasSize.maxY / 2};//定义webgl画布中心的位置
let clickNum = 1000;
let clickedPoint = {x: 0, y: 0};
//初始化点集
let points = [];
for (let i = 0; i < NUMPOINTS; i++) {
    points.push(initPoints(i));
}
let triangles = [];
for (let i = 0; i < NUMPOLYGON; i++) {
    let result = initTriangle(i);
    if (result instanceof Object) {
        triangles.push(result.one);
        triangles.push(result.two);
    }
}

function initPoints(index) {
    let point = {};
    point.x = (vertex_pos[index][0] - CENTER.x) / CENTER.x;
    point.y = -(vertex_pos[index][1] - CENTER.y) / CENTER.y;
    point.colorR = vertex_color[index][0] / 255;
    point.colorG = vertex_color[index][1] / 255;
    point.colorB = vertex_color[index][2] / 255;
    return point;
}

function initTriangle(index) {
    let triangle = {};
    triangle.a = polygon[index][0];
    triangle.b = polygon[index][1];
    triangle.c = polygon[index][3];
    let triangle1 = {};
    triangle1.a = polygon[index][1];
    triangle1.b = polygon[index][2];
    triangle1.c = polygon[index][3];
    return {one: triangle, two: triangle1};
}

function drawTriangles(gl) {
// Draw the triangles
    for (let i = 0; i < NUMTRIANGLES; i++) {
        let n = initVertexBuffers(gl, i);
        gl.drawArrays(gl.TRIANGLES, 0, n);
    }
}

function init() {
    // Get the rendering context for WebGL
    let gl = getWebGLContext(canvas);
// Initialize shaders
    initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
// Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);//红绿蓝和透明度四个参数
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawTriangles(gl);
}

// Retrieve <canvas> element
let canvas = document.getElementById('webgl');
canvas.height = canvasSize.maxY;
canvas.width = canvasSize.maxX;
//添加事件监听，鼠标按住，移动，抬起事件
document.addEventListener("mousedown", press);
document.addEventListener("mouseup", up);
document.addEventListener("mousemove", move);
init();

function initVertexBuffers(gl, index) {
    let point1 = points[triangles[index].a];
    let point2 = points[triangles[index].b];
    let point3 = points[triangles[index].c];
    let verticesColors = new Float32Array([
        // Vertex coordinates and color
        point1.x, point1.y, point1.colorR, point1.colorG, point1.colorB,
        point2.x, point2.y, point2.colorR, point2.colorG, point2.colorB,
        point3.x, point3.y, point3.colorR, point3.colorG, point3.colorB
    ]);
    // console.log(verticesColors);
    let n = 3;

    // Create a buffer object
    let vertexColorBuffer = gl.createBuffer();
    if (!vertexColorBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    let FSIZE = verticesColors.BYTES_PER_ELEMENT;
    //Get the storage location of a_Position, assign and enable buffer
    let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

    // Get the storage location of a_Position, assign buffer and enable
    let a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
    gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return n;
}

//获取鼠标位置
function getPosition(mouseEvent, canvas) {
    let x, y;
    if (mouseEvent.pageX !== undefined && mouseEvent.pageY !== undefined) {
        x = mouseEvent.pageX;
        y = mouseEvent.pageY;
    } else {
        x = canvas.offsetLeft;
        y = canvas.offsetTop;
    }

    return {x: (x - canvas.offsetLeft - CENTER.x) / CENTER.x, y: -(y - canvas.offsetTop - CENTER.y) / CENTER.y};
}

//获取画布上点之间的距离，主要用于判断鼠标拖动顶点
function getDistance(point0, point1) {
    let distance = 1000;
    if (point0 instanceof Object && point1 instanceof Object) {
        let dx = point1.x - point0.x, dy = point1.y - point0.y;
        distance = dx * dx + dy * dy;
    }
    return distance <= 0.0025 ? 1 : -1;
}

//创建鼠标事件的响应
function press(e) {
    clickedPoint = getPosition(e, canvas);
    console.log(clickedPoint);
    for (let i = 0; i < NUMPOINTS; i++) {
        if (getDistance(points[i], clickedPoint) > 0) {
            console.log(i);
            clickNum = i;
            return;
        }
    }
    clickNum = 1000;
}

function up() {
    clickNum = 1000;
}

function move(e) {
    if (clickNum < NUMPOINTS) {
        let location = getPosition(e, canvas);
        //这里稍微克制一下，控制点在距离边界10px外以正常显示（可以移动之后）
        if (location.x >= -1.0 && location.x <= 1.0 && location.y >= -1.0 && location.y <= 1.0) {
            let newPoint = {};
            newPoint.x = location.x - clickedPoint.x + points[clickNum].x;
            newPoint.y = location.y - clickedPoint.y + points[clickNum].y;
            points[clickNum].x = newPoint.x;
            points[clickNum].y = newPoint.y;
            clickedPoint = location;
        }
        init();
    }
}
