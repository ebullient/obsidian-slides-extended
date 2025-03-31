import type { ChartJsOptions, Options, Processor } from "src/@types";

type ChartObject = {
    data: DataObject;
    options: ChartJsOptions;
};

type DataEntry = {
    data: number[];
    label: string;
    backgroundColor?: string;
};

type DataObject = {
    labels: string[];
    datasets: DataEntry[];
};

export class ChartProcessor implements Processor {
    private typeRegex = /type:\s(\w*)/;
    private labelRegex = /labels:\s(.*)/;
    private datasetRegex = /title:\s(.*)\s*data:\s(.*)/g;
    private spanGapsRegex = /(spanGaps):\s(.*)/;
    private tensionRegex = /(tension):\s(.*)/;
    private beginAtZeroRegex = /(beginAtZero):\s(.*)/;
    private legendRegex = /(legend):\s(.*)/;
    private legendPositionRegex = /(legendPosition):\s(.*)/;
    private stackedRegex = /(stacked):\s(.*)/;
    private heightRegex = /(height):\s(.*)/;
    private useThemeColorsRegex = /(useThemeColors):\s(.*)/;

    private colorMap = [
        "#4285f4",
        "#ea4335",
        "#fbbc05",
        "#34a853",
        "#673ab7",
        "#cccccc",
        "#777777",
    ];

    process(markdown: string, options: Options) {
        return this.transformChart(markdown, options);
    }

    transformChart(markdown: string, options: Options): string {
        const startIdx = markdown.indexOf("```chart");

        if (startIdx < 0) {
            return markdown;
        }
        const endIdx = markdown.indexOf("```", startIdx + 11);
        if (endIdx < 0) {
            return markdown;
        }
        const colorMap = [...this.colorMap];

        const before = markdown.substring(0, startIdx);
        const after = markdown.substring(endIdx + 3);
        const chartMarkup = markdown.substring(startIdx + 8, endIdx);

        if (this.typeRegex.test(chartMarkup)) {
            const [, type] = this.typeRegex.exec(chartMarkup);

            const chart: ChartObject = {
                data: {
                    datasets: [],
                    labels: [],
                },
                options: { elements: {} },
            };

            if (this.useThemeColorsRegex.test(chartMarkup)) {
                const [, , value] = this.useThemeColorsRegex.exec(chartMarkup);

                if (value.trim() === "true") {
                    for (let i = 0; i < 7; i++) {
                        const style = getComputedStyle(
                            document.body,
                        ).getPropertyValue(`--chart-color-${i + 1}`);
                        if (style !== "") {
                            colorMap[i] = style;
                        }
                    }
                }
            }
            if (this.labelRegex.test(chartMarkup)) {
                const [, labels] = this.labelRegex.exec(chartMarkup);
                chart.data.labels = parseLabels(labels);

                this.datasetRegex.lastIndex = 0;

                let i = 0;

                while (true) {
                    const m = this.datasetRegex.exec(chartMarkup);
                    if (m == null) {
                        break;
                    }
                    if (m.index === this.datasetRegex.lastIndex) {
                        this.datasetRegex.lastIndex++;
                    }
                    const [, title, data] = m;

                    chart.data.datasets.push({
                        data: JSON.parse(data),
                        label: title,
                        backgroundColor: colorMap[i],
                    });
                    i++;
                }

                chart.options.elements[type] = {};

                if (this.spanGapsRegex.test(chartMarkup)) {
                    const [, key, value] = this.spanGapsRegex.exec(chartMarkup);
                    chart.options.elements[type][key] = JSON.parse(value);
                }
                if (this.tensionRegex.test(chartMarkup)) {
                    const [, key, value] = this.tensionRegex.exec(chartMarkup);
                    chart.options.elements[type][key] = JSON.parse(value);
                }
                if (this.beginAtZeroRegex.test(chartMarkup)) {
                    const [, key, value] =
                        this.beginAtZeroRegex.exec(chartMarkup);

                    if (!chart.options.scales) {
                        chart.options.scales = {};
                    }

                    if (!chart.options.scales.y) {
                        chart.options.scales.y = {};
                    }

                    chart.options.scales.y[key] = JSON.parse(value);
                }
                if (this.legendRegex.test(chartMarkup)) {
                    const [, , value] = this.legendRegex.exec(chartMarkup);

                    if (!chart.options.plugins) {
                        chart.options.plugins = {};
                    }

                    if (!chart.options.plugins.legend) {
                        chart.options.plugins.legend = {};
                    }

                    chart.options.plugins.legend.display = JSON.parse(value);
                }

                if (this.legendPositionRegex.test(chartMarkup)) {
                    const [, , value] =
                        this.legendPositionRegex.exec(chartMarkup);

                    if (!chart.options.plugins) {
                        chart.options.plugins = {};
                    }

                    if (!chart.options.plugins.legend) {
                        chart.options.plugins.legend = {};
                    }

                    chart.options.plugins.legend.position = value;
                }
                if (this.stackedRegex.test(chartMarkup)) {
                    const [, key, value] = this.stackedRegex.exec(chartMarkup);

                    if (!chart.options.scales) {
                        chart.options.scales = {};
                    }

                    if (!chart.options.scales.y) {
                        chart.options.scales.y = {};
                    }
                    if (!chart.options.scales.x) {
                        chart.options.scales.x = {};
                    }

                    chart.options.scales.x[key] = JSON.parse(value);
                    chart.options.scales.y[key] = JSON.parse(value);
                }
                if (this.heightRegex.test(chartMarkup)) {
                    const [, , value] = this.heightRegex.exec(chartMarkup);
                    options.height = +value;
                }

                const canvas = `<canvas style="max-height:${options.height}px" data-chart="${type}" >\n<!--\n${JSON.stringify(chart)}-->\n</canvas>`;

                const result = `${before.trimEnd()}\n${canvas}\n${after.trimStart()}`;
                return this.transformChart(result, options);
            }
        }
        return markdown;
    }
}
function parseLabels(labels: string): string[] {
    return labels
        .substring(1, labels.length - 1)
        .split(",")
        .map((label) => {
            let value = label.trim();
            if (value.startsWith("'") || value.startsWith('"')) {
                value = value.substring(1);
            }
            if (value.endsWith("'") || value.endsWith('"')) {
                value = value.substring(0, value.length - 1);
            }
            return `${value.trim()}`;
        });
}
