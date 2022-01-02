window.onload = main;

function main() {
  // canvasエレメントを取得
  const canvas = document.getElementById('canvas');
  canvas.width = 500;
  canvas.height = 300;

  // webglコンテキストを取得
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  // canvasを初期化する色を設定する
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // canvasを初期化する際の深度を設定する
  gl.clearDepth(1.0);

  // canvasを初期化
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // 頂点シェーダとフラグメントシェーダの生成
  const vShader = createShader(gl, 'vs');
  const fShader = createShader(gl, 'fs');

  // プログラムオブジェクトの生成とリンク
  const prg = createProgram(gl, vShader, fShader);

  // attributeLocationを配列に取得
  const attLocation = new Array(2);
  attLocation[0] = gl.getAttribLocation(prg, 'position');
  attLocation[1] = gl.getAttribLocation(prg, 'color');

  // attributeの要素数を配列に格納
  const attStride = new Array(2);
  attStride[0] = 3;
  attStride[1] = 4;

  // 頂点の位置情報を格納する配列
  const vertexPosition = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0];

  // 頂点の色情報を格納する配列
  const vertexColor = [1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0];

  // VBOの作成
  const positionVbo = createVbo(gl, vertexPosition);
  const colorVbo = createVbo(gl, vertexColor);

  // VBOをバインドし登録する（位置情報）
  gl.bindBuffer(gl.ARRAY_BUFFER, positionVbo);
  gl.enableVertexAttribArray(attLocation[0]);
  gl.vertexAttribPointer(attLocation[0], attStride[0], gl.FLOAT, false, 0, 0);

  // VBOをバインドし登録する（色情報）
  gl.bindBuffer(gl.ARRAY_BUFFER, colorVbo);
  gl.enableVertexAttribArray(attLocation[1]);
  gl.vertexAttribPointer(attLocation[1], attStride[1], gl.FLOAT, false, 0, 0);

  // minMatrix.js を用いた行列関連処理
  // matIVオブジェクトを生成
  const m = new matIV();

  // uniformLocationの取得
  const uniLocation = gl.getUniformLocation(prg, 'mvpMatrix');

  // 各種行列の生成と初期化
  const mMatrix = m.identity(m.create());
  const vMatrix = m.identity(m.create());
  const pMatrix = m.identity(m.create());
  const tmpMatrix = m.identity(m.create());
  const mvpMatrix = m.identity(m.create());

  // ビューxプロジェクション座標変換行列
  m.lookAt([0.0, 0.0, 3.0], [0, 0, 0], [0, 1, 0], vMatrix);
  m.perspective(90, canvas.width / canvas.height, 0.1, 100, pMatrix);
  m.multiply(pMatrix, vMatrix, tmpMatrix);

  // 一つ目のモデルを移動するためのモデル変換行列
  m.translate(mMatrix, [1.5, 0.0, 0.0], mMatrix);

  // モデルxビューxプロジェクション(一つ目のモデル)
  m.multiply(tmpMatrix, mMatrix, mvpMatrix);

  // uniformLocationへ座標変換行列を登録し描画する(一つ目のモデル)
  gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // 二つ目のモデルを移動するためのモデル座標変換行列
  m.identity(mMatrix);
  m.translate(mMatrix, [-1.5, 0.0, 0.0], mMatrix);

  // uniformLocationへ座標変換行列を登録し描画する(二つ目のモデル)
  m.multiply(tmpMatrix, mMatrix, mvpMatrix);

  // uniformLocationへ座標変換行列を登録し描画する(二つ目のモデル)
  gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // コンテキストの再描画
  gl.flush();
}

function createShader(gl, id) {
  // シェーダを格納する変数
  let shader;

  // HTMLからscriptタグへの参照を取得
  let scriptElement = document.getElementById(id);

  // scriptタグが存在しない場合は抜ける
  if (!scriptElement) {
    return;
  }

  // scriptタグのtype属性をチェック
  switch (scriptElement.type) {
    // 頂点シェーダの場合
    case 'x-shader/x-vertex':
      shader = gl.createShader(gl.VERTEX_SHADER);
      break;

    // フラグメントシェーダの場合
    case 'x-shader/x-fragment':
      shader = gl.createShader(gl.FRAGMENT_SHADER);
      break;

    default:
      return;
  }

  // 生成されたシェーダにソースを割り当てる
  gl.shaderSource(shader, scriptElement.text);

  // シェーダをコンパイルする
  gl.compileShader(shader);

  // シェーダが正しくコンパイルされたかチェック
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  } else {
    alert(gl.getShaderInfoLog(shader));
  }
}

function createProgram(gl, vs, fs) {
  // プログラムオブジェクトの生成
  const program = gl.createProgram();

  // プログラムオブジェクトにシェーダーを割り当てる
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);

  // シェーダをリンク
  gl.linkProgram(program);

  // シェーダのリンクが正しく行われたかチェック
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    // 成功していたらプログラムオブジェクトを有効にする
    gl.useProgram(program);

    // プログラムオブジェクトを返して終了
    return program;
  } else {
    // 失敗していたらエラーログをアラートする
    alert(gl.getProgramInfoLog(program));
  }
}

function createVbo(gl, data) {
  // バッファオブジェクトの生成
  const vbo = gl.createBuffer();

  // バッファをバインドする
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

  // バッファにデータををセット
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

  // バッファのバインドを無効化
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // 生成した VBO を返して終了
  return vbo;
}
