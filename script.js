function main() {
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl');

  if (gl === null) {
    alert('WebGL を初期化できません。ブラウザあーまたはマシンがサポートしていない可能性があります。');
    return;
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

window.onload = main;
