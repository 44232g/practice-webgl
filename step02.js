window.onload = main;

//
// Start here
//
function main() {
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl');

  // If we don't have a GL context, give up now
  if (gl === null) {
    alert('WebGL を初期化できません。ブラウザあーまたはマシンがサポートしていない可能性があります。');
    return;
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Vertex shader program
  const vsSource = `
      attribute vec4 aVertexPosition;
  
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
  
      void main() {
          gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      }
    `;

  // Fragment shader program
  const fsSource = `
      void main() {
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
    `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attribute our shader program is using
  // for aVertexPosition and look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition')
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix')
    }
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  // Draw the scene
  drawScene(gl, programInfo, buffers);
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
    return null;
  }

  return shader;
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple two-dimensional square.
//
function initBuffers(gl) {
  // 正方形の位置用のバッファを作成する。
  const positionBuffer = gl.createBuffer();

  // positonBuffer をコンテキストのバッファに適用する。
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // 正方形の位置の配列を作成する。
  const positions = [-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0];

  // WebGL に位置のリストを渡し、形状を構築する。
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return {
    position: positionBuffer
  };
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, buffers) {
  // 黒の不透明にクリアする。
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // 深度テストをクリアする。
  gl.clearDepth(1.0);

  // 深度テストを有効にする。
  gl.enable(gl.DEPTH_TEST);

  // 近くのものは遠くのものを覆い隠す。
  gl.depthFunc(gl.LEQUAL);

  // 描画を開始する前に canvas をクリアする。
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // パースペクティブマトリクスを作成します．これは，カメラにおける遠近法の歪みをシミュレートするための特殊なマトリクスです．
  // 視野角は 45 度、幅と高さの比率はキャンバスの表示サイズに合わせ、カメラから 0.1 単位から 100 単位の距離にあるオブジェクトのみを表示するようにします。
  const fieldOfView = (45 * Math.PI) / 180; // ラジアンで
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // 注意：glmatrix.jsは常に第1引数を結果の受け取り先とする．
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  // 描画位置をシーンの中心である「identity」点に設定する。
  const modelViewMatrix = mat4.create();

  // ここで、正方形の描画を開始したい位置まで描画位置を少し移動させます。
  mat4.translate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to translate
    [-0.0, 0.0, -6.0] // amount to translate
  );

  // WebGL に、位置バッファから vertexPosition 属性に位置を引き出す方法を指示します。
  {
    const numComponents = 2; // pull out 2 values per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  // 描画時に作成したプログラムを使用するよう WebGL に伝える。
  gl.useProgram(programInfo.program);

  // シェーダーのユニフォームを設定する。
  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}
