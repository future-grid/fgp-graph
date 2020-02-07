import Dygraph from "dygraphs";

import {DomAttrs, GraphConfig, ViewConfig, GraphCollection, GraphExports, ViewOptions} from "./metadata/configurations";
import {DropdownButton, DomElementOperator, GraphOperator} from "./widgets/DomElements";

import {ResizeObserver, ResizeObserverEntry} from '@juggle/resize-observer';

import {EventHandlers} from './metadata/graphoptions';

export default class FgpGraph {

    graphContainer: HTMLElement;

    header: HTMLElement;

    body: HTMLElement;

    private bottom!: HTMLElement;

    private graph!: Dygraph;

    private rangeBarGraph!: Dygraph;

    viewConfigs: Array<ViewConfig>;

    private parentDom: HTMLElement;

    viewsDropdown: HTMLElement;

    intervalsDropdown: HTMLElement;

    intervalLabelsArea: HTMLElement;

    seriesDropdown: HTMLElement;

    private exportButtons!: HTMLElement[];

    private fieldPattern = new RegExp(/data[.]{1}[a-zA-Z0-9]+/g);

    public children: Array<FgpGraph> = [];

    // store locally
    private rangeBarData: any = [];

    private currentDateWindow: number[] = [];

    id: string;

    private operator!: GraphOperator;

    private callbackDelayTimer: any = 0;

    eventListeners?: EventHandlers;


    /**
     *Creates an instance of FgpGraph.
     * @param {HTMLElement} dom
     * graph container
     * @param {Array<ViewConfig>} viewConfigs
     * graph configuration
     * @memberof FgpGraph
     */
    constructor(dom: HTMLElement, viewConfigs: Array<ViewConfig>, eventHandlers?: EventHandlers) {

        this.parentDom = dom;

        if (eventHandlers) {
            this.eventListeners = eventHandlers;
        }


        this.id = (Math.random() * 10000 | 0) + 1 + '';

        // if id exist then change id to id
        if (this.parentDom.getAttribute('id')) {
            this.id = this.parentDom.id;
        }

        //
        if (this.parentDom.getAttribute("fgp-graph-id")) {
            this.id = <string>this.parentDom.getAttribute("fgp-graph-id");
        }

        let viewsDropdownAttrs: Array<DomAttrs> = [{key: 'class', value: "fgp-views-dropdown"}];
        this.viewsDropdown = DomElementOperator.createElement('select', viewsDropdownAttrs);

        let intervalsDropdownAttrs: Array<DomAttrs> = [{key: 'class', value: "fgp-intervals-dropdown"}];
        this.intervalsDropdown = DomElementOperator.createElement('select', intervalsDropdownAttrs);

        let intervalsLabelsAttrs: Array<DomAttrs> = [{key: 'class', value: "fgp-interval-labels"}];
        this.intervalLabelsArea = DomElementOperator.createElement('div', intervalsLabelsAttrs);

        let seriesDropdownAttrs: Array<DomAttrs> = [{key: 'class', value: "fgp-series-dropdown"}];
        this.seriesDropdown = DomElementOperator.createElement('div', seriesDropdownAttrs);


        let buttonsAttrs: Array<DomAttrs> = [{key: 'class', value: "fgp-buttons"}];
        const buttonsArea = DomElementOperator.createElement('div', buttonsAttrs);

        let filterAttrs: Array<DomAttrs> = [{key: 'class', value: "fgp-filter-buttons"}];
        const filterArea = DomElementOperator.createElement('div', filterAttrs);

        let toolbarAreaAttrs: Array<DomAttrs> = [{key: 'class', value: "fgp-toolbar-area"}];
        const toolbarArea = DomElementOperator.createElement('div', toolbarAreaAttrs);


        let headerAttrs: Array<DomAttrs> = [{key: 'class', value: 'fgp-graph-header'}];
        this.header = DomElementOperator.createElement('div', headerAttrs);
        this.header.appendChild(buttonsArea);
        this.header.appendChild(filterArea);
        this.header.appendChild(toolbarArea);
        this.header.appendChild(this.viewsDropdown);
        this.header.appendChild(this.intervalsDropdown);
        this.header.appendChild(this.seriesDropdown);
        this.header.appendChild(this.intervalLabelsArea);
        // create doms
        let containerAttrs: Array<DomAttrs> = [{key: 'class', value: 'fgp-graph-container noselect'}];
        this.graphContainer = DomElementOperator.createElement('div', containerAttrs);

        this.graphContainer.appendChild(this.header);

        let bodyAttrs: Array<DomAttrs> = [{key: 'class', value: 'fgp-graph-body'}];
        this.body = DomElementOperator.createElement('div', bodyAttrs);
        this.graphContainer.appendChild(this.body);
        this.parentDom.appendChild(this.graphContainer);
        this.viewConfigs = viewConfigs;
        // listening for div resizing.......
        const divResizeRo = new ResizeObserver((roes: ResizeObserverEntry[], observer) => {
            roes.forEach((domObserverEntry) => {
                if (this.graph && domObserverEntry.target.className == 'fgp-graph-body') {
                    console.log("resizing dom: ", domObserverEntry.target.className, 'if someone see a infinite loop here, please report it to author!');
                    if (isNaN(domObserverEntry.contentRect.width) || isNaN(domObserverEntry.contentRect.height)) {
                    } else {
                        // resize graph manually, because dygraph resizing base on window object.
                        this.graph.resize(NaN, NaN);
                    }
                } else {
                    console.log("resizing not support for: ", domObserverEntry.target.className);
                }
            });
        });
        divResizeRo.observe(this.body);
    }

    /**
     *update datewindow for children graphs
     * @param datewindow
     * @param currentView
     * @private
     * @memberof FgpGraph
     */
    private dateWindowHandler = (dateWindow: [number, number], currentView?: ViewConfig) => {


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

        this.children.forEach(graph => {
            // call updateDatewinow
            if (graph.id != this.id) {
                graph.updateDatewinowInside(dateWindow);
            }
        });

    };

    /**
     * func for switching view
     * @param view
     */
    public changeView = (view: string) => {
        // change view
        // find view
        this.viewConfigs.forEach(config => {
            if (config.name === view) {

                this.operator.init(config, (graph: Dygraph) => {
                    this.graph = graph;

                    this.children.forEach(graph => {
                        // call updateDatewinow
                        if (graph.id != this.id) {
                            // update data
                            graph.operator.refresh();
                        }
                    });

                }, () => {
                    this.children.forEach(graph => {
                        // call updateDatewinow
                        if (graph.id != this.id) {
                            // update data
                            graph.operator.refresh();
                        }
                    });
                });

                // check if we need to tell others the view changed.
                if (this.eventListeners && this.eventListeners.onViewChange) {
                    //f call
                    this.eventListeners.onViewChange(this, config);
                }

                // update dropdownlist
                if (view && this.viewsDropdown) {
                    (<HTMLSelectElement>this.viewsDropdown).value = view;
                }
            }
        });
    };

    /**
     * init graph with configuration
     *
     * @private
     * @memberof FgpGraph
     */
    public initGraph = () => {
        this.operator = new GraphOperator(this.graph, this.rangeBarGraph, this.graphContainer, this.body, this.intervalsDropdown, this.header, this.dateWindowHandler, this, this.eventListeners, this.id);
        // which "view" should be shown first? device or scatter?
        if (this.viewConfigs) {
            let showView: ViewConfig | undefined;
            let dropdownOpts: Array<{ id: string, label: string, selected?: boolean }> = [];
            this.viewConfigs.forEach(view => {
                if (view.show) {
                    // init graph 
                    showView = view;
                }
                dropdownOpts.push({id: view.name, label: view.name, selected: view.show});
            });
            // add options into view dropdown list
            const viewsDropdonwOptions = new DropdownButton(<HTMLSelectElement>this.viewsDropdown, [...dropdownOpts]);
            viewsDropdonwOptions.render();
            // add callback handler
            this.viewsDropdown.onchange = (e) => {
                const choosedView = (<HTMLSelectElement>e.target).value;
                this.changeView(choosedView);
            };
            if (showView) {
                this.operator.init(showView, (graph: Dygraph) => {
                    this.graph = graph;
                }, () => {
                    this.children.forEach(graph => {
                        // call updateDatewinow
                        if (graph.id != this.id) {
                            // update data
                            graph.operator.refresh();
                        }
                    });
                });
            }
        }
    };


    /**
     *update currrent graph datewindow
     * @param datewindow
     * @memberof FgpGraph
     */
    public updateDatewinow = (datewindow: [number, number]) => {
        // update graph 
        if (this.graph) {
            const range: Array<number> = this.graph.xAxisRange();
            // if datewindow same then ignore that
            if (range[0] != datewindow[0] || range[1] != datewindow[1]) {
                this.graph.updateOptions({
                    dateWindow: datewindow
                });
                // reload data for current graph
                this.operator.update(undefined, undefined, true, datewindow);
                // get all children graphs then run update
                this.children.forEach(child => {
                   child.updateDatewinowInside(datewindow, true);
                });
            }
        }
    };

    private updateDatewinowInside = (datewindow: [number, number], forceReload?: boolean) => {
        // update graph
        if (this.graph) {
            const range: Array<number> = this.graph.xAxisRange();
            if (range[0] != datewindow[0] || range[1] != datewindow[1]) {
                this.graph.updateOptions({
                    dateWindow: datewindow
                });
            }
            if(forceReload){
                this.operator.update(undefined, undefined, true, datewindow);
            }
        }
    };

    /**
     *bind children graphs
     * @param graphs
     * children graphs
     * @memberof FgpGraph
     */
    public setChildren = (graphs: Array<FgpGraph>) => {
        this.children = this.children.concat(graphs);
    };

    /**
     * highlight line on graph
     * @param series
     * name of lines
     * @param duration
     * unhighlight after <duration> seconds  0 means highlight forever
     *
     * @memberof FgpGraph
     */
    public highlightSeries = (series: string[], duration: number, type?: string) => {
        //
        this.operator.highlightSeries(series, duration, type);
    };

    /**
     * reload data for graph. base on series not changed!
     */
    public reloadData = () => {
        this.operator.update(undefined, undefined, true);
    };

    /**
     * do it later
     * @param config
     */
    public updateConfig = (config: ViewOptions) => {
        //
        return "not enabled in this version";
    };

}
