window.onload = main;

//
// Start here
//
function main() {
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl');

  // GL contextがなければ
  if (gl === null) {
    alert('WebGL を初期化できません。ブラウザーまたはマシンがサポートしていない可能性があります。');
    return;
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // 頂点シェーダー
  const vsSource = `
      attribute vec4 aVertexPosition;
  
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
  
      void main() {
          gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      }
    `;

  // フラグメントシェーダー
  const fsSource = `
      void main() {
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
    `;

  // シェーダープログラムを初期化する。ここで頂点などに対するすべてのライティングが確立される。
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // シェーダープログラムを使用するために必要な情報をすべて収集する。
  // シェーダープログラムがどの属性を使用しているかを調べる。をaVertexPositionに変換し、均一な位置を検索します。
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

  // 描画するすべてのオブジェクトを構築するルーチンを呼び出します。
  const buffers = initBuffers(gl);

  // シーンを描画する。
  drawScene(gl, programInfo, buffers);
}

//
// シェーダープログラムを初期化し、WebGL がデータの描画方法を認識できるようにする。
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // シェーダープログラムを作成する。
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // シェーダープログラムの作成に失敗した場合、アラートを出す。
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(`次のシェーダープログラムを初期化できません: ${gl.getProgramInfoLog(shaderProgram)}`);
    return null;
  }

  return shaderProgram;
}

//
// 与えられたタイプのシェーダーを作成し、ソースをコンパイルします。
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // シェーダーオブジェクトにソースを送る。
  gl.shaderSource(shader, source);

  // シェーダープログラムをコンパイルする。
  gl.compileShader(shader);

  // コンパイルに成功したかどうかを確認する。
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(`次のシェーダーのコンパイル中にエラーが発生しました: ${gl.getShaderInfoLog(shader)}`);
    return null;
  }

  return shader;
}

//
// 必要なバッファを初期化する。このデモでは オブジェクトは1つで、単純な2次元の正方形である。
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
// シーンを描画する。
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
  const fieldOfView = (45 * Math.PI) / 180; // ラジアン
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
    modelViewMatrix, // destination マトリックス。
    modelViewMatrix, // 変換する行列。
    [-0.0, 0.0, -6.0] // 翻訳する量。
  );

  // WebGL に、位置バッファから vertexPosition 属性に位置を引き出す方法を指示します。
  {
    const numComponents = 2; // 反復ごとに2つの値を取り出す
    const type = gl.FLOAT; // バッファのデータは32bit浮動小数点数
    const normalize = false; // 正規化しない
    // ある値のセットから次の値まで何バイトで取得するか
    // 0 = 上記の type と numComponents を使用します。
    const stride = 0;
    // バッファ内の何バイトから開始するか
    const offset = 0;
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
