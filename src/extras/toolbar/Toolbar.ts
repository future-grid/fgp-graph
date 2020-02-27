import Dygraph from "dygraphs";
import {GraphCollection, GraphExports, ViewConfig} from "../../metadata/configurations";
import Badges from "./widgets/Badges";
import Exports from "./widgets/Exports";
import Series from "./widgets/Series";
import Intervals from "./widgets/Intervals";
import View from "./widgets/View";
import Filter from "./widgets/Filter";
import Extra from "./widgets/Extra";

export interface ReserveSpace {
    x: number;
    y: number;
    w: number;
    h: number
}


export interface Layout {
    chart_div: HTMLDivElement,

    reserveSpaceLeft(px: number): ReserveSpace;

    reserveSpaceRight(px: number): ReserveSpace;

    reserveSpaceTop(px: number): ReserveSpace;

    reserveSpaceBottom(px: number): ReserveSpace;

    chartRect(): ReserveSpace;

}

export default class Toolbar {

    private g?: Dygraph;

    private readonly collectionOpts: any;

    private readonly viewConfig: ViewConfig;

    private badges?: Badges;
    private exports?: Exports;
    private series?: Series;
    private intervals?: Intervals;
    private view?: View;
    private filter?: Filter;
    private extra?: Extra;

    private graphHeader?: Element;

    private graphDiv?: Element;

    private readonly views: Array<ViewConfig>;

    constructor(view: ViewConfig, views: Array<ViewConfig>, public collectionSelectionListener: (collections: Array<GraphCollection>) => void, public intervalSelectionListener: (collection: GraphCollection, dateWindow: [number, number]) => void, public viewChangeListener: (view: ViewConfig) => void, public reactSelectionListener?: (active: boolean) => void) {
        this.collectionOpts = view.graphConfig.collections;
        this.views = views;
        this.viewConfig = view;
    }

    activate = (graph: Dygraph) => {
        this.g = graph;
        // only add once
        const graphDiv = (<any>graph).graphDiv;

        this.graphDiv = graphDiv;
        // create div
        let fullHide = false;
        if (this.viewConfig.graphConfig.hideHeader && this.viewConfig.graphConfig.hideHeader === true) {
            fullHide = true;
        } else {

            if (this.viewConfig.graphConfig.hideHeader) {
                const hideHeader = this.viewConfig.graphConfig.hideHeader;

                let div: HTMLElement = document.createElement("div");
                div.style.width = "100%";
                div.style.height = "30px;";
                div.setAttribute("class", "fgp-graph-header");
                graphDiv?.appendChild(div);
                this.graphHeader = div;


                if (this.viewConfig.graphConfig.features.exports) {
                    this.createExportBtns(this.viewConfig.graphConfig.features.exports);
                }


                if (!hideHeader.toolbar && this.viewConfig.graphConfig.features.toolbar) {
                    this.createExtraToolbar();
                }

                if (this.viewConfig.graphConfig.filters) {
                    this.createFilter();
                }

                if (!hideHeader.views) {
                    this.createView();
                }

                if (!hideHeader.intervals) {
                    this.createInterval();
                }


                if (!hideHeader.series) {
                    this.createSeries();
                }


                this.createCollectionBadges(this.collectionOpts);
            } else {
                let div: HTMLElement = document.createElement("div");
                div.style.width = "100%";
                div.style.height = "30px;";
                div.setAttribute("class", "fgp-graph-header");
                graphDiv?.appendChild(div);
                this.graphHeader = div;

                this.createExportBtns(this.viewConfig.graphConfig.features.exports);
                this.createExtraToolbar();
                this.createFilter();
                this.createView();
                this.createInterval();
                this.createSeries();
                this.createCollectionBadges(this.collectionOpts);
            }
        }


        return {
            layout: fullHide ? this.reserveSpaceTop0 : this.reserveSpaceTop
        };
    };


    private reserveSpaceTop = (e: Layout) => {
        e.reserveSpaceTop(30);
    };

    private reserveSpaceTop0 = (e: Layout) => {
        e.reserveSpaceTop(0);
    };


    private createExportBtns = (config?: GraphExports[]) => {
        if (this.graphHeader && config) {
            this.exports = new Exports(this.graphHeader, config, this.graphDiv, this.reactSelectionListener);
        }
    };


    private createView = () => {
        if (this.graphHeader) {
            this.view = new View(this.graphHeader, this.views, this.viewChangeListener);
        }
    };

    private createInterval = () => {
        if (this.graphHeader) {
            this.intervals = new Intervals(this.graphHeader, this.viewConfig, this.g, this.intervalSelectionListener);
        }
    };

    private createSeries = () => {
        if (this.graphHeader) {
            this.series = new Series(this.graphHeader, this.viewConfig, this.g);
        }
    };

    private createFilter = () => {
        if (this.graphHeader) {
            this.filter = new Filter(this.graphHeader, this.viewConfig, this.g);
        }
    };

    private createExtraToolbar = () => {
        if (this.graphHeader) {
            this.extra = new Extra(this.graphHeader, this.viewConfig);
        }
    };

    /**
     * Add collection badge on graph.
     * @param g  "dygraph" instance
     * @param collections
     */
    private createCollectionBadges = (collections: Array<GraphCollection>) => {
        if (this.graphHeader) {
            this.badges = new Badges(this.graphHeader, collections, this.collectionSelectionListener);
        }
    };

    /**
     * call this function to update all toolbar widgets
     * @param dateWindow
     */
    public updateDateWindow = (dateWindow: Array<number>, dateRange: Array<number>) => {
        // update dateWindow for badges
        this.badges?.setDateWindow(dateWindow);
        this.intervals?.setDateWindow(dateWindow, dateRange);
    };

    public updateData = (collection: GraphCollection, labels: string[], data: any[]) => {
        console.log(`current collection is `, collection);
        this.badges?.autoSelect(collection);
        this.exports?.setData(data, labels, collection);
        this.series?.setData(collection);
        this.filter?.setData(collection);
    };


}