let toggleButton;
let workInput;
let breakInput;
const timer = new Timer();

let song;

let fft;
let smoothSpectrum;
let prevR;

const maxVolume = 90;

let volume;
const effectSize = [];

let sign = true;

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  // workInput = createInput("25");
  // workInput.position(windowWidth - 200, windowHeight - 200);
  // workInput.size(150);
  // workInput.style("font-size", "32px");
  // workInput.style("padding", "10px 20px");
  // workInput.style("border", "2px solid black");
  // workInput.style("border-radius", "5px");
  // workInput.style("text-align", "center");
  workInput = document.querySelector("#workInput");
  workInput.value = "25";
  workInput.onchange = () => {
    const value = workInput.value;
    if (value > 0) {
      timer.workingPeriod = value * 60 * 1000;
      if (timer.isWorking) {
        timer.remainingTime = timer.workingPeriod;
      }
    } else {
      this.workingPeriod = 0;
      if (timer.isWorking) {
        timer.remainingTime = 0;
      }
    }
  };
  breakInput = document.querySelector("#breakInput");
  breakInput.value = "5";
  breakInput.onchange = () => {
    const value = breakInput.value;
    if (value > 0) {
      timer.breakPeriod = value * 60 * 1000;
      if (!timer.isWorking) {
        timer.remainingTime = timer.breakPeriod;
      }
    } else {
      this.breakPeriod = 0;
      if (!timer.isWorking) {
        timer.remainingTime = 0;
      }
    }
  };

  canvas.drop(gotFile);

  fft = new p5.FFT(0.8, 64 * 4);
  volume = new p5.Amplitude(0.9);

  timer.onPeriodSwitch = (isWorking) => {
    if (!isWorking) {
      if (song && song.isPlaying()) {
        song.setVolume(1);
        song.fade(0, 2); // fade to volume 0 over 2 seconds
        setTimeout(() => {
          song.stop();
          song.setVolume(1); // reset volume for next play
        }, 2000);
      }
    } else {
      song.setVolume(1);
      song.loop();
    }
  };
}

function draw() {
  background("#FAFAFA");

  // draw grid
  stroke(0, 50);
  strokeWeight(1);
  for (let i = 0; i < width; i += 50) {
    line(i, 0, i, height);
  }
  for (let i = 0; i < height; i += 50) {
    line(0, i, width, i);
  }

  let progress = map(timer.remainingTime, 0, timer.workingPeriod, 0, TWO_PI);
  const timerSize = min(windowWidth, windowHeight) * 0.8;
  push();
  fill(255);
  noStroke();
  ellipse(width / 2, height / 2, timerSize, timerSize);
  pop();
  push();
  noFill();
  stroke(0);
  strokeWeight(10);
  arc(
    width / 2,
    height / 2,
    timerSize,
    timerSize,
    -HALF_PI,
    -HALF_PI + progress
  );
  pop();

  noStroke();
  fill(0);
  textSize(timerSize * 0.2);
  textAlign(CENTER, CENTER);
  text(
    Timer.formatTime(timer.remainingTime),
    windowWidth / 2,
    windowHeight / 2
  );
  textSize(timerSize * 0.06);
  text(timer.isWorking ? "work" : "break", width / 2, height / 2 + 100);

  // draw the visualizer
  push();
  const spectrumRaw = fft.analyze();
  const smoothness = 0.7;
  if (!smoothSpectrum) {
    smoothSpectrum = new Array(spectrumRaw.length).fill(0);
  }
  for (let i = 0; i < spectrumRaw.length; i++) {
    smoothSpectrum[i] = lerp(smoothSpectrum[i], spectrumRaw[i], smoothness);
  }
  const spectrum = smoothSpectrum;

  translate(width / 2, height / 2);
  for (let i = 0; i < spectrum.length; i++) {
    const amp = spectrum[i];
    const angle = -map(i, 0, spectrum.length, 0, TWO_PI) - HALF_PI - PI / 90;
    const targetR = map(amp, 0, 500, 0, maxVolume);
    if (!prevR) {
      prevR = new Array(spectrum.length).fill(0);
    }
    prevR[i] = lerp(prevR[i], targetR, smoothness);
    const r = prevR[i] * 2;
    const x2 = (timerSize / 2) * cos(angle);
    const y2 = (timerSize / 2) * sin(angle);
    const x3 = (timerSize / 2 - r) * cos(angle);
    const y3 = (timerSize / 2 - r) * sin(angle);
    push();
    // if (
    //   i / spectrum.length <
    //   (timer.workingPeriod - timer.remainingTime) / timer.workingPeriod
    // ) {
    //   stroke(0, 0, 0, 100);
    // } else {
    stroke(0);
    // }
    strokeWeight(4);
    line(x2, y2, x3, y3);
    pop();
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // toggleButton.position(windowWidth / 2 - 75, windowHeight / 2 + 100);
  workInput.position(windowWidth - 200, windowHeight - 200);
  breakInput.position(windowWidth - 200, windowHeight - 120);
}

function gotFile(file) {
  if (file.type === "audio") {
    console.log(file);
    canvasText = "Playing audio...";
    // redraw();
    loadSound(
      file.data,
      (sound) => {
        timer.start();
        if (song) {
          song.stop();
        }
        song = sound;
        song.loop();
      },
      () => {
        console.log("error loading audio file");
      },
      () => {
        console.log("now loading...");
      }
    );
  } else {
    // If the file dropped into the canvas is not an image,
    // change the instructions to 'Not an image file!'
    canvasText = "Not an audio file!";
    redraw();
  }
}

function gotFiles(files) {
  for (let i = 0; i < files.length; i++) {
    if (files[i].type === "audio") {
      console.log(files[i]);
      canvasText = "Playing audio...";
      // redraw();
      loadSound(
        files[i].data,
        (sound) => {
          timer.start();
          if (song) {
            song.stop();
          }
          song = sound;
          song.loop();
        },
        () => {
          console.log("error loading audio file");
        },
        () => {
          console.log("now loading...");
        }
      );
    } else {
      // If the file dropped into the canvas is not an image,
      // change the instructions to 'Not an image file!'
      canvasText = "Not an audio file!";
      redraw();
    }
  }
}
