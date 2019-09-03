// canvas要素を取得
var c = document.getElementById('canvas');
var cw;
var ch;

// canvasサイズをwindowサイズにする
c.width = cw = window.innerWidth;
c.height = ch = window.innerHeight;

// 描画に必要なコンテキスト(canvasに描画するためのAPIにアクセスできるオブジェクト)を取得
var ctx = c.getContext('2d');

// AudioNodeを管理するAudioContextの生成
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();


/**
 * 音声ファイルローダー
 */
var Loader = function(url) {
  this.url = url;  // 読み込む音声データのURL
};

// XMLHttpRequestを利用して音声データ(バッファ)を読み込む。
Loader.prototype.loadBuffer = function() {
  var loader, request;
  loader = this;
  request = new XMLHttpRequest();
  request.open('GET', this.url, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    // 取得したデータをデコードする。
    audioCtx.decodeAudioData(this.response, function(buffer) {
      if (!buffer) {
        console.log('error');
        return;
      }
      loader.playSound(buffer);  // デコードされたデータを再生する。
    }, function(error) {
      console.log('decodeAudioData error');
    });
  };

  request.onerror = function() {
    console.log('Loader: XHR error');
  };

  request.send();
};

// 読み込んだ音声データ(バッファ)を再生と波形データの描画を開始する。
Loader.prototype.playSound = function(buffer) {
  var visualizer = new Visualizer(buffer);
};


/**
 * ビジュアライザー
 */
var Visualizer = function(buffer) {
  this.sourceNode = audioCtx.createBufferSource();  // AudioBufferSourceNodeを作成
  this.sourceNode.buffer = buffer;                  // 取得した音声データ(バッファ)を音源に設定
  this.analyserNode = audioCtx.createAnalyser();    // AnalyserNodeを作成
  this.times = new Uint8Array(this.analyserNode.frequencyBinCount);  // 時間領域の波形データを格納する配列を生成 
  this.sourceNode.connect(this.analyserNode);       // AudioBufferSourceNodeをAnalyserNodeに接続
  this.analyserNode.connect(audioCtx.destination);  // AnalyserNodeをAudioDestinationNodeに接続
  this.sourceNode.start(0);                         // 再生開始
  this.draw();                                      // 描画開始
};

Visualizer.prototype.draw = function() {
  // 0~1まで設定でき、0に近いほど描画の更新がスムーズになり, 1に近いほど描画の更新が鈍くなる。
  this.analyserNode.smoothingTimeConstant = 0.5;

  // FFTサイズを指定する。デフォルトは2048。
  this.analyserNode.fftSize = 2048;

  // 時間領域の波形データを引数の配列に格納するメソッド。
  // analyserNode.fftSize / 2の要素がthis.timesに格納される。今回の配列の要素数は1024。
  this.analyserNode.getByteTimeDomainData(this.times);

  // 全ての波形データを描画するために、一つの波形データのwidthを算出する。
  var barWidth = cw / this.analyserNode.frequencyBinCount;

  ctx.fillStyle = 'rgba(0, 0, 0, 1)';
  ctx.fillRect(0, 0, cw, ch);

  // analyserNode.frequencyBinCountはanalyserNode.fftSize / 2の数値。よって今回は1024。
  for (var i = 0; i < this.analyserNode.frequencyBinCount; ++i) {
    var value = this.times[i]; // 波形データ 0 ~ 255までの数値が格納されている。
    var percent = value / 255; // 255が最大値なので波形データの%が算出できる。
    var height = ch * percent; // %に基づく高さを算出
    var offset = ch - height;  // y座標の描画開始位置を算出

    ctx.fillStyle = '#fff';
    ctx.fillRect(i * barWidth, offset, barWidth, 2);
  }

  window.requestAnimationFrame(this.draw.bind(this));
};

// requestAnimationFrameを多くのブラウザで利用するためにprefixの記載
var setUpRAF = function() {
  var requestAnimationFrame = window.requestAnimationFrame ||
                              window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame ||
                              window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
};

setUpRAF();
var loader = new Loader('main.mp3');
loader.loadBuffer();