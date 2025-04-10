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
  canvas.parent("canvas-container");
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
  
  // canvas.drop(gotFile);

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
}

const playlist = [];
const playlistElement = document.getElementById("playlist");
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const fileSelectLink = document.getElementById("fileSelectLink");

fileSelectLink.addEventListener("click", (e) => {
  e.preventDefault();
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  handleFiles(fileInput.files);
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("bg-light");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("bg-light");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("bg-light");

  const files = event.dataTransfer.files;
  handleFiles(files);
});

function handleFiles(files) {
  for (const file of files) {
    if (file.type.startsWith("audio/")) {
      const url = URL.createObjectURL(file);
      const name = file.name;

      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.textContent = name;

      li.addEventListener("click", () => {
        if (song && song.isPlaying()) {
          song.stop();
        }
        loadSound(url, (sound) => {
          song = sound;
          song.play();
          updatePlaylistIcons(name);
        });
      });

      playlistElement.appendChild(li);
      playlist.push({ name, url });
    }
  }
}

function updatePlaylistIcons(currentName) {
  const items = playlistElement.querySelectorAll("li");
  items.forEach((item) => {
    if (item.textContent.includes(currentName)) {
      item.innerHTML = `<i class="bi bi-play-circle-fill me-2"></i>${currentName}`;
    } else {
      item.innerHTML = item.textContent.replace(/^🔊\s*/, "");
    }
  });
}

const collapseBtn = document.getElementById("collapseBtn");
const sidebar = document.getElementById("sidebar");

collapseBtn.addEventListener("click", () => {
  const isCollapsed = sidebar.style.width === "0px";
  if (isCollapsed) {
    sidebar.style.width = "300px";
    sidebar.querySelectorAll("*").forEach(el => {
      if (el !== collapseBtn) el.style.display = "";
    });
    collapseBtn.innerHTML = '<i class="bi bi-chevron-left"></i>';
  } else {
    sidebar.style.width = "0px";
    sidebar.querySelectorAll("*").forEach(el => {
      if (el !== collapseBtn) el.style.display = "none";
    });
    collapseBtn.style.display = "block";
    collapseBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
  }
});

const startBtn = document.getElementById("startTimerButton");
const startWrapper = document.getElementById("startButtonWrapper");

startBtn.addEventListener("click", () => {
  timer.start();
  if (playlist.length > 0) {
    let currentTrack = 0;
    const firstTrack = playlist[0];
    loadSound(firstTrack.url, (sound) => {
      // if (song) song.stop();
      song = sound;
      song.play();
      // song.loop();
    });
    setInterval(() => {
      if(!song.isPlaying()) {
        currentTrack++;
        if (currentTrack >= playlist.length) {
          currentTrack = 0;
        }
        const track = playlist[currentTrack];
        loadSound(track.url, (sound) => {
          song.stop();
          song = sound;
          song.play();
          // updatePlaylistIcons(track.name);
        });
      }
    }, 1000);
    
  }
  startWrapper.style.display = "none";
});