window.onload = main;

function main() {
  // canvasエレメントを取得
  const canvas = document.getElementById('canvas');
  canvas.width = 500;
  canvas.height = 300;

  // webglコンテキストを取得
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  // canvasを黒でクリア(初期化)する
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}
