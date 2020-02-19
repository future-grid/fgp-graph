import {FilterType, GraphCollection, ViewConfig} from "../../../metadata/configurations";
import {Formatters} from "../../formatters";
import moment from "moment-timezone";
import {hsvToRGB} from "../../../services/colorService";

export default class Filter {

    private chosenCollection?: GraphCollection;

    constructor(public parentElement: Element, public viewConfig: ViewConfig, public g?: Dygraph) {
        this.initDom();
    }

    private setVisibility = (series: Array<string>) => {
        // set visibility
        let graphLabels: Array<string> = this.g?.getOption('labels');
        let visibility: Array<boolean> = [];
        let labels = graphLabels.filter((element, index, array) => {
            if (index != 0) {
                visibility.push(true);
                return true;
            }
            return false;
        });

        let formatters: Formatters = new Formatters(this.viewConfig.timezone ? this.viewConfig.timezone : moment.tz.guess());
        // get current y and y2 axis scaling max and min
        let ranges: Array<Array<number>> = (<any>this.g).yAxisRanges();


        labels.map((value, index, array) => {
            // never hide mark lines
            visibility[index] = series.includes(value) || value.indexOf("_markline") != -1;
        });

        // set visibility
        this.g?.updateOptions({
            visibility: visibility,
            axes: {
                x: {
                    axisLabelFormatter: formatters.axisLabel
                },
                y: {
                    valueRange: ranges[0],
                    axisLabelWidth: 80,
                    labelsKMB: true
                },
                y2: ranges.length > 1 ? {
                    valueRange: ranges[1],
                    axisLabelWidth: 80,
                    labelsKMB: true
                } : undefined
            }
        });
    };

    private setColors = (colors: Array<string>) => {
        // check if length match or not
        let graphLabels = this.g?.getLabels();
        let formatters: Formatters = new Formatters(this.viewConfig.timezone ? this.viewConfig.timezone : moment.tz.guess());
        let sat = 1.0;
        let val = 0.5;
        // get current y and y2 axis scaling max and min
        let ranges: Array<Array<number>> = (<any>this.g).yAxisRanges();
        if (graphLabels && graphLabels.length - 1 === colors.length) {
            this.g?.updateOptions({
                colors: colors,
                axes: {
                    x: {
                        axisLabelFormatter: formatters.axisLabel
                    },
                    y: {
                        valueRange: ranges[0],
                        axisLabelWidth: 80,
                        labelsKMB: true
                    },
                    y2: ranges.length > 1 ? {
                        valueRange: ranges[1],
                        axisLabelWidth: 80,
                        labelsKMB: true
                    } : undefined
                }
            });
        } else {
            if (this.viewConfig.graphConfig.entities.length > 1) {
                this.g?.updateOptions({
                    colors: undefined,
                    axes: {
                        x: {
                            axisLabelFormatter: formatters.axisLabel
                        },
                        y: {
                            valueRange: ranges[0],
                            axisLabelWidth: 80,
                            labelsKMB: true
                        },
                        y2: ranges.length > 1 ? {
                            valueRange: ranges[1],
                            axisLabelWidth: 80,
                            labelsKMB: true
                        } : undefined
                    }
                });
            } else {
                if (this.chosenCollection) {
                    let defaultColors: Array<string> = [];
                    const num = this.chosenCollection.series.length;
                    this.chosenCollection.series.forEach((series, i) => {
                        let half = Math.ceil(num / 2);
                        let idx = i % 2 ? (half + (i + 1) / 2) : Math.ceil((i + 1) / 2);
                        let hue = (1.0 * idx / (1 + num));
                        let colorStr = hsvToRGB(hue, sat, val);
                        defaultColors.push(series.color ? series.color : colorStr);
                    });

                    this.g?.updateOptions({
                        colors: defaultColors,
                        axes: {
                            x: {
                                axisLabelFormatter: formatters.axisLabel
                            },
                            y: {
                                valueRange: ranges[0],
                                axisLabelWidth: 80,
                                labelsKMB: true
                            },
                            y2: ranges.length > 1 ? {
                                valueRange: ranges[1],
                                axisLabelWidth: 80,
                                labelsKMB: true
                            } : undefined
                        }
                    });
                }
            }
        }
    };


    private initDom = () => {
        // 2 div buttons and dropdown
        let filterContainer: HTMLDivElement = document.createElement('div');
        filterContainer.setAttribute("class", "fgp-filter-container");

        // check buttons
        if (this.viewConfig.graphConfig.filters && this.viewConfig.graphConfig.filters.buttons) {
            // create button area

            const buttons = document.createElement("div");
            buttons.setAttribute("class", "fgp-filter-buttons");
            //
            this.viewConfig.graphConfig.filters.buttons.forEach(filter => {
                let button: HTMLSpanElement = document.createElement("button");
                button.className = "fgp-filter-button";
                button.textContent = filter.label;
                button.addEventListener('click', (event) => {
                    // call function and get series list back
                    if (!filter.type || filter.type == FilterType.HIGHLIGHT) {
                        const series: Array<string> = <Array<string>>filter.func();
                        this.setVisibility(series);
                    } else if (filter.type == FilterType.COLORS) {
                        //
                        let labels: string[] = [];
                        if (this.g) {
                            labels = labels.concat(...this.g.getLabels());
                            labels = labels.slice(1);
                        }

                        const colors: Array<string> = <Array<string>>filter.func(labels);
                        // update colors
                        this.setColors(colors);
                    }
                });
                // add button
                buttons.appendChild(button);
            });


            filterContainer.appendChild(buttons);

        }

        if (this.viewConfig.graphConfig.filters && this.viewConfig.graphConfig.filters.dropdown) {

            const select = document.createElement("select");
            select.setAttribute("class", "fgp-filter-dropdown");

            this.viewConfig.graphConfig.filters.dropdown.forEach(_drop => {
                // options
                const option = document.createElement('option');
                option.text = _drop.label;
                option.value = _drop.label;
                select.add(option);
            });

            select.addEventListener("change", (e: Event) => {
                if (this.viewConfig.graphConfig.filters && this.viewConfig.graphConfig.filters.dropdown) {
                    const _conf = this.viewConfig.graphConfig.filters.dropdown[select.selectedIndex];
                    if (!_conf.type || _conf.type == FilterType.HIGHLIGHT) {
                        const series: Array<string> = <Array<string>>_conf.func();
                        // compare then update graph
                        this.setVisibility(series);
                    } else if (_conf.type == FilterType.COLORS) {
                        let labels: string[] = [];
                        if (this.g) {
                            labels = labels.concat(...this.g.getLabels());
                            labels = labels.slice(1);
                        }
                        const colors: Array<string> = <Array<string>>_conf.func(labels);
                        this.setColors(colors);
                    }

                }
            });


            filterContainer.appendChild(select);
        }


        this.parentElement.appendChild(filterContainer);
    };


    public setData = (collection: GraphCollection) => {
        this.chosenCollection = collection;

    };


}