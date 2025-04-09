class Timer {
  constructor(workingPeriod = 25 * 60 * 1000, breakPeriod = 5 * 60 * 1000) {
    this.workingPeriod = workingPeriod;
    this.breakPeriod = breakPeriod;
    this.isWorking = true;
    this.remainingTime = workingPeriod;
    this.intervalId = null;
    this.isTimerRunning = false;
  }

  start() {
    if (this.intervalId) return;
    this.isTimerRunning = true;

    this.intervalId = setInterval(() => {
      this.remainingTime -= 1000;

      if (this.onTick) {
        this.onTick(this.remainingTime);
      }

      if (this.remainingTime <= 0) {
        this.switchPeriod();
      }
    }, 1000);
  }

  pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isTimerRunning = false;
      this.intervalId = null;
    }
  }

  reset() {
    this.remainingTime = this.isWorking ? this.workingPeriod : this.breakPeriod;
    this.isTimerRunning = false;
  }

  switchPeriod() {
    this.isWorking = !this.isWorking;
    this.remainingTime = this.isWorking ? this.workingPeriod : this.breakPeriod;

    if (this.onPeriodSwitch) {
      this.onPeriodSwitch(this.isWorking);
    }
  }

  static formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes} : ${seconds < 10 ? "0" : ""}${seconds}`;
  }
}
