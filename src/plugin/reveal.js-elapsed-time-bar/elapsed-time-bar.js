window.ElapsedTimeBar = window.ElapsedTimeBar || {
    id: "ElapsedTimeBar",
    start: (allottedTime, elapsedTime) => {
        ElapsedTimeBar.start(allottedTime, elapsedTime);
    },
    reset: () => {
        ElapsedTimeBar.reset();
    },
    pause: () => {
        ElapsedTimeBar.pause();
    },
    resume: () => {
        ElapsedTimeBar.resume();
    },
};

const ElapsedTimeBar = {
    id: "ElapsedTimeBar",

    // default value
    barColor: "rgb(200,0,0)",
    pausedBarColor: "rgba(200,0,0,.6)",

    isPaused: false,
    isFinished: false,

    allottedTime: null,
    timeProgressBar: null,
    startTime: null,
    pauseTime: null,
    pauseTimeDuration: 0,

    /**
     * initialize elements
     */
    handleReady() {
        const config = Reveal.getConfig();

        // activate this plugin if config.allottedTime exists.
        if (!config.allottedTime) {
            console.warn(
                '"allottedTime" property is required by the ElapsedTimeBar plugin.',
            );
            return;
        }

        // set configurations
        this.barColor = config.barColor || this.barColor;
        this.pausedBarColor = config.pausedBarColor || this.pausedBarColor;

        // calc barHeight from config.barHeight or page-progress container
        let barHeight;
        const pageProgressContainer = document.querySelector(".progress");
        if (config.progressBarHeight) {
            barHeight = `${Number.parseInt(config.progressBarHeight, 10)}px`;

            // override height of page-progress container
            if (pageProgressContainer) {
                pageProgressContainer.style.height = barHeight;
            }
        } else if (config.progress && pageProgressContainer) {
            // get height from page-progress container
            barHeight = `${pageProgressContainer.getBoundingClientRect().height}px`;
        } else {
            // default
            barHeight = "3px";
        }

        // create container of time-progress
        const timeProgressContainer = document.createElement("div");
        timeProgressContainer.classList.add("progress");
        for (const [k, v] of Object.entries({
            display: "block",
            position: "fixed",
            bottom: config.progress ? barHeight : 0,
            width: "100%",
            height: barHeight,
        })) {
            timeProgressContainer.style[k] = v;
        }

        document.querySelector(".reveal").appendChild(timeProgressContainer);

        // create content of time-progress
        this.timeProgressBar = document.createElement("div");
        for (const [k, v] of Object.entries({
            height: "100%",
            willChange: "width",
        })) {
            this.timeProgressBar.style[k] = v;
        }

        timeProgressContainer.appendChild(this.timeProgressBar);

        // start timer (convert to milliseconds)
        this.start(this.convertToMilliseconds(config.allottedTime));
    },

    /**
     * Convert time value to milliseconds
     * @param {number|string} value - Time as number (seconds) or string with unit (e.g., "30m", "1h", "90s")
     * @returns {number} Time in milliseconds
     */
    convertToMilliseconds(value) {
        // If it's a number, assume seconds
        if (typeof value === "number") {
            return value * 1000;
        }

        // If it's a string, parse it
        if (typeof value === "string") {
            const match = value.match(/^(\d+)\s*(\w+)?/i);
            if (match) {
                const num = Number.parseInt(match[1], 10);
                const unit = match[2] ? match[2].toLowerCase() : "s"; // default to seconds

                switch (unit) {
                    case "h":
                        return num * 60 * 60 * 1000;
                    case "m":
                        return num * 60 * 1000;
                    case "s":
                        return num * 1000;
                    case "ms":
                        return num;
                    default:
                        // Unrecognized unit, default to seconds
                        console.warn(
                            "Unrecognized unit when specifying alloted time",
                            value,
                        );
                        return num * 1000;
                }
            }
        }

        // Fallback: assume seconds
        return value * 1000;
    },

    /**
     * update repeatedly using requestAnimationFrame.
     */
    loop() {
        if (this.isPaused) return;
        const now = Date.now();
        const elapsedTime = now - this.startTime - this.pauseTimeDuration;
        if (elapsedTime > this.allottedTime) {
            this.timeProgressBar.style.width = "100%";
            this.isFinished = true;
        } else {
            this.timeProgressBar.style.width = `${(elapsedTime / this.allottedTime) * 100}%`;
            requestAnimationFrame(this.loop.bind(this));
        }
    },

    /**
     * set color of progress bar
     */
    setBarColor() {
        if (this.isPaused) {
            this.timeProgressBar.style.backgroundColor = this.pausedBarColor;
        } else {
            this.timeProgressBar.style.backgroundColor = this.barColor;
        }
    },

    /**
     * start(reset) timer with new allotted time.
     * @param {number} allottedTime - Time in milliseconds
     * @param {number} [elapsedTime=0] - Elapsed time in milliseconds
     */
    start(allottedTime, elapsedTime = 0) {
        this.isFinished = false;
        this.isPaused = false;
        this.allottedTime = allottedTime;
        this.startTime = Date.now() - elapsedTime;
        this.pauseTimeDuration = 0;
        this.setBarColor();
        this.loop();
    },

    reset() {
        this.start(this.allottedTime);
    },

    pause() {
        if (this.isPaused) return;
        this.isPaused = true;
        this.pauseTime = Date.now();
        this.setBarColor();
    },

    resume() {
        if (!this.isPaused) return;

        // add paused time duration
        this.isPaused = false;
        this.pauseTimeDuration += Date.now() - this.pauseTime;
        this.pauseTime = null;
        this.setBarColor();
        this.loop();
    },
};

if (Reveal.isReady()) {
    ElapsedTimeBar.handleReady();
} else {
    Reveal.addEventListener("ready", () => ElapsedTimeBar.handleReady());
}
