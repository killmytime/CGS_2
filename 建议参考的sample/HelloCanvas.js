// HelloCanvas.js (c) 2012 matsuda
function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Set clear color设置清空用的颜色
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear <canvas>清空颜色缓冲
  gl.clear(gl.COLOR_BUFFER_BIT);
}
