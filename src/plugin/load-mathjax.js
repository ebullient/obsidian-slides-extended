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
        enableExplorer: false,
        enableAssistiveMml: false,
        enableEnrichment: false,
        menuOptions: {
            settings: {
                assistiveMml: false,
                collapsible: false,
                explorer: false,
            },
        },
        renderActions: {
            assistiveMml: [],
        },
    },
    startup: {
        ready: () => {
            MathJax.startup.defaultReady();
            console.log("MathJax initialized with all extensions");
        },
    },
};
