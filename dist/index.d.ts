import { ViewConfig } from "./metadata/configurations";
export declare class FgpGraph {
    private graphContainer;
    private header;
    private body;
    private bottom;
    private graph;
    private rangeBarGraph;
    private viewConfigs;
    private defaultGraphRanges;
    private parentDom;
    private viewsDropdown;
    private intervalsDropdown;
    private intervalLabelsArea;
    private seriesDropdown;
    private fieldPattern;
    private childrenGraphs;
    private rangeBarData;
    serialnumber: number;
    private operator;
    constructor(dom: HTMLElement, viewConfigs: Array<ViewConfig>);
    private datewindowHandler;
    /**
     * init graph with configuration
     *
     * @private
     * @memberof FgpGraph
     */
    initGraph: () => void;
    updateDatewinow: (datewindow: number[]) => void;
    setChildren: (graphs: FgpGraph[]) => void;
}
