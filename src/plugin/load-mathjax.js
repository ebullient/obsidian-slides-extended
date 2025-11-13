// Queue for typeset calls that happen before MathJax is ready
const typesetQueue = [];
let mathJaxReady = false;

window.MathJax = {
    tex: {
        inlineMath: [
            ["$", "$"],
            ["\\(", "\\)"],
        ],
        displayMath: [
            ["$$", "$$"],
            ["\\[", "\\]"],
        ],
        processEscapes: true,
        processEnvironments: true,
        processRefs: true,
    },
    chtml: {
        matchFontHeight: true,
        displayAlign: "center",
        displayIndent: "0",
        scale: 1.0,
        adaptiveCSS: true,
    },
    options: {
        enableMenu: false,
        enableEnrichment: false,
    },
    startup: {
        ready: () => {
            const preamblePath = window.mathJaxPreamblePath;
            const preamblePromise =
                preamblePath &&
                preamblePath.trim().length > 0 &&
                preamblePath.trim() !== "undefined"
                    ? fetch(preamblePath)
                          .then((response) => {
                              if (!response.ok) {
                                  throw new Error(
                                      `Failed to load preamble file: ${response.statusText}`,
                                  );
                              }
                              return response.text();
                          })
                          .catch((err) => {
                              console.error(
                                  `Slides Extended: Could not load preamble file at '${preamblePath}'.`,
                                  err,
                              );
                              return ""; // Resolve with empty string on failure
                          })
                    : Promise.resolve("");

            MathJax.startup.defaultReady();
            MathJax.startup.promise.then(async () => {
                const preamble = await preamblePromise;
                if (preamble && preamble.trim().length > 0) {
                    // Process the preamble. This makes definitions available globally.
                    MathJax.tex2chtml(preamble);
                }

                console.debug("MathJax initialized and ready");
                mathJaxReady = true;

                // Process any queued typeset calls
                if (typesetQueue.length > 0) {
                    console.debug(
                        `Processing ${typesetQueue.length} queued MathJax typeset calls`,
                    );
                    typesetQueue.forEach((args) => {
                        MathJax.typesetPromise(...args).catch((err) =>
                            console.error("Queued typeset error:", err),
                        );
                    });
                    typesetQueue.length = 0;
                }
            });
        },
    },
    // Provide a safe typeset function that queues calls if MathJax isn't ready yet
    typeset: (...args) => {
        if (mathJaxReady && MathJax.typesetPromise) {
            return MathJax.typesetPromise(...args);
        }
        // Queue the call for later
        typesetQueue.push(args);
        console.debug("MathJax not ready yet, queuing typeset call");
        return Promise.resolve();
    },
};
