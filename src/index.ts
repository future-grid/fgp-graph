import Dygraph from "dygraphs";

import {DomAttrs, ViewConfig, ViewOptions} from "./metadata/configurations";
import {DomElementOperator, GraphOperator} from "./widgets/DomElements";

import {ResizeObserver, ResizeObserverEntry} from '@juggle/resize-observer';

import {EventHandlers} from './metadata/graphoptions';

export default class FgpGraph {

    graphContainer: HTMLElement;

    body: HTMLElement;

    private graph!: Dygraph;

    private rangeBarGraph!: Dygraph;

    viewConfigs: Array<ViewConfig>;

    private parentDom: HTMLElement;


    intervalLabelsArea: HTMLElement;

    private exportButtons!: HTMLElement[];

    private fieldPattern = new RegExp(/data[.]{1}[a-zA-Z0-9]+/g);

    public children: Array<FgpGraph> = [];

    // store locally
    private rangeBarData: any = [];

    private currentDateWindow: number[] = [];

    id: string;

    public operator!: GraphOperator;

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



        let intervalsLabelsAttrs: Array<DomAttrs> = [{key: 'class', value: "fgp-interval-labels"}];
        this.intervalLabelsArea = DomElementOperator.createElement('div', intervalsLabelsAttrs);

        let buttonsAttrs: Array<DomAttrs> = [{key: 'class', value: "fgp-buttons"}];
        const buttonsArea = DomElementOperator.createElement('div', buttonsAttrs);

        let filterAttrs: Array<DomAttrs> = [{key: 'class', value: "fgp-filter-buttons"}];
        const filterArea = DomElementOperator.createElement('div', filterAttrs);

        let toolbarAreaAttrs: Array<DomAttrs> = [{key: 'class', value: "fgp-toolbar-area"}];
        const toolbarArea = DomElementOperator.createElement('div', toolbarAreaAttrs);



        // create doms
        let containerAttrs: Array<DomAttrs> = [{key: 'class', value: 'fgp-graph-container noselect'}];
        this.graphContainer = DomElementOperator.createElement('div', containerAttrs);


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
                        console.log(`new size is: ${domObserverEntry.contentRect.width} ${domObserverEntry.contentRect.height}`);
                        let evt = window.document.createEvent('UIEvents');
                        evt.initEvent('resize', false, false);
                        window.dispatchEvent(evt);
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
            config.show = false;
            if (config.name === view) {
                // update show attribute
                config.show = true;
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
            }
        });
    };

    /**
     * init graph with configuration
     *
     * @private
     * @memberof FgpGraph
     */
    public initGraph = (ready?: (g: FgpGraph) => void) => {
        this.operator = new GraphOperator(this.graph, this.rangeBarGraph, this.graphContainer, this.body, this.dateWindowHandler, this, this.eventListeners, this.id);
        // which "view" should be shown first? device or scatter?
        if (this.viewConfigs) {
            let showView: ViewConfig | undefined;
            // check if showView is undefined
            if (!showView && this.viewConfigs.length > 0) {
                showView = this.viewConfigs[0];
            } else if (!showView && this.viewConfigs.length === 0) {
                console.error("view config not found!");
                return false;
            }

            if (showView) {
                this.operator.init(showView, (graph: Dygraph) => {
                    this.graph = graph;
                    if(ready){
                        ready(this);
                    }
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
            if (forceReload) {
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
