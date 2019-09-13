import Dygraph from "dygraphs";

import { DomAttrs, GraphConfig, ViewConfig, GraphCollection, GraphExports } from "./metadata/configurations";
import { DropdownButton, DomElementOperator, GraphOperator } from "./widgets/DomElements";

export default class FgpGraph {

    private graphContainer: HTMLElement;

    private header: HTMLElement;

    private body: HTMLElement;

    private bottom!: HTMLElement;

    private graph!: Dygraph;

    private rangeBarGraph!: Dygraph;

    private viewConfigs: Array<ViewConfig>;

    private defaultGraphRanges: Array<{ name: string, value: number, show?: boolean }>;

    private parentDom: HTMLElement;

    private viewsDropdown: HTMLElement;

    private intervalsDropdown: HTMLElement;

    private intervalLabelsArea: HTMLElement;

    private seriesDropdown: HTMLElement;

    private exportButtons!: HTMLElement[];

    private fieldPattern = new RegExp(/data[.]{1}[a-zA-Z0-9]+/g);

    private childrenGraphs: Array<FgpGraph> = [];

    // store locally
    private rangeBarData: any = [];

    private currentDateWindow: number[] = [];

    public serialnumber = -1;

    private operator!: GraphOperator;

    private callbackDelayTimer: any = 0;

    constructor(dom: HTMLElement, viewConfigs: Array<ViewConfig>) {

        this.defaultGraphRanges = [
            { name: "3 days", value: (1000 * 60 * 60 * 24 * 3), show: true },
            { name: "7 days", value: 604800000, show: true },
            { name: "1 month", value: 2592000000, show: false }
        ];
        this.parentDom = dom;

        this.serialnumber = (Math.random() * 10000 | 0) + 1;

        let viewsDropdownAttrs: Array<DomAttrs> = [{ key: 'class', value: "fgp-views-dropdown" }];
        this.viewsDropdown = DomElementOperator.createElement('select', viewsDropdownAttrs);

        let intervalsDropdownAttrs: Array<DomAttrs> = [{ key: 'class', value: "fgp-intervals-dropdown" }];
        this.intervalsDropdown = DomElementOperator.createElement('select', intervalsDropdownAttrs);

        let intervalsLabelsAttrs: Array<DomAttrs> = [{ key: 'class', value: "fgp-interval-labels" }];
        this.intervalLabelsArea = DomElementOperator.createElement('div', intervalsLabelsAttrs);

        let seriesDropdownAttrs: Array<DomAttrs> = [{ key: 'class', value: "fgp-series-dropdown" }];
        this.seriesDropdown = DomElementOperator.createElement('div', seriesDropdownAttrs);


        let buttonsAttrs: Array<DomAttrs> = [{ key: 'class', value: "fgp-buttons" }];
        const buttonsArea = DomElementOperator.createElement('div', buttonsAttrs);

        let headerAttrs: Array<DomAttrs> = [{ key: 'class', value: 'fgp-graph-header' }];
        this.header = DomElementOperator.createElement('div', headerAttrs);
        this.header.appendChild(buttonsArea);
        this.header.appendChild(this.viewsDropdown);
        this.header.appendChild(this.intervalsDropdown);
        this.header.appendChild(this.seriesDropdown);
        this.header.appendChild(this.intervalLabelsArea);
        // create doms
        let containerAttrs: Array<DomAttrs> = [{ key: 'class', value: 'fgp-graph-container noselect' }];
        this.graphContainer = DomElementOperator.createElement('div', containerAttrs);
        this.graphContainer.appendChild(this.header);

        let bodyAttrs: Array<DomAttrs> = [{ key: 'class', value: 'fgp-graph-body' }];
        this.body = DomElementOperator.createElement('div', bodyAttrs);
        this.graphContainer.appendChild(this.body);
        this.parentDom.appendChild(this.graphContainer);
        this.viewConfigs = viewConfigs;
    }

    private dateWindowHandler = (dateWindow: Array<number>, currentView?: ViewConfig) => {


        if ((this.currentDateWindow[0] && this.currentDateWindow[0] !== dateWindow[0]) || (this.currentDateWindow[1] && this.currentDateWindow[1] !== dateWindow[1])) {
            if (this.callbackDelayTimer) {
                clearTimeout(this.callbackDelayTimer);
            }
            this.callbackDelayTimer = setTimeout(() => {
                if (currentView && currentView.interaction && currentView.interaction.callback && currentView.interaction.callback.syncDateWindow) {
                    currentView.interaction.callback.syncDateWindow(dateWindow);
                }
            }, 100);
        }

        this.currentDateWindow = dateWindow;

        this.childrenGraphs.forEach(graph => {
            // call updateDatewinow
            if (graph.serialnumber != this.serialnumber) {
                graph.updateDatewinow(dateWindow);
            }
        });

    }



    /**
     * init graph with configuration
     *
     * @private
     * @memberof FgpGraph
     */
    public initGraph = () => {
        this.operator = new GraphOperator(this.graph, this.rangeBarGraph, this.graphContainer, this.body, this.intervalsDropdown, this.header, this.dateWindowHandler);
        // which "view" should be shown first? device or scatter?
        if (this.viewConfigs) {
            let showView: ViewConfig | undefined;
            let dropdownOpts: Array<{ id: string, label: string, selected?: boolean }> = [];
            this.viewConfigs.forEach(view => {
                if (view.show) {
                    // init graph 
                    showView = view;
                }
                dropdownOpts.push({ id: view.name, label: view.name, selected: view.show });
            });
            // add options into view dropdown list
            const viewsDropdonwOptions = new DropdownButton(<HTMLSelectElement>this.viewsDropdown, [...dropdownOpts]);
            viewsDropdonwOptions.render();
            // add callback handler
            this.viewsDropdown.onchange = (e) => {
                const choosedView = (<HTMLSelectElement>e.target).value;
                // change view
                // find view 
                this.viewConfigs.forEach(config => {
                    if (config.name === choosedView) {
                        this.operator.init(config, (graph: Dygraph) => {
                            this.graph = graph;

                            this.childrenGraphs.forEach(graph => {
                                // call updateDatewinow
                                if (graph.serialnumber != this.serialnumber) {
                                    // update data
                                    graph.operator.refresh();
                                }
                            });

                        }, () => {
                            this.childrenGraphs.forEach(graph => {
                                // call updateDatewinow
                                if (graph.serialnumber != this.serialnumber) {
                                    // update data
                                    graph.operator.refresh();
                                }
                            });
                        });
                    }
                });
            }

            if (showView) {
                this.operator.init(showView, (graph: Dygraph) => {
                    this.graph = graph;
                }, () => {
                    this.childrenGraphs.forEach(graph => {
                        // call updateDatewinow
                        if (graph.serialnumber != this.serialnumber) {
                            // update data
                            graph.operator.refresh();
                        }
                    });
                });
            }
        }
    }




    public updateDatewinow = (datewindow: Array<number>) => {
        // update graph 
        if (this.graph) {
            const range: Array<number> = this.graph.xAxisRange();
            // if datewindow same then ignorn that
            if (range[0] != datewindow[0] || range[1] != datewindow[1]) {
                this.graph.updateOptions({
                    dateWindow: datewindow
                });
            }
        }
    }

    public setChildren = (graphs: Array<FgpGraph>) => {
        this.childrenGraphs = this.childrenGraphs.concat(graphs);
    }

    /**
     * highlight line on graph
     * 
     * Multiple lines each time
     * @param series  name of lines
     * @param duration unhighlight after <duration> seconds  0 means highlight forever
     * 
     * @memberof FgpGraph
     */
    public highlightSeries = (series: string[], duration: number) => {
        //
        this.operator.highlightSeries(series, duration);
    }


}