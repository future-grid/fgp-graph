import Dygraph from "dygraphs";
import moment from 'moment';

import { DomAttrs, GraphConfig, ViewConfig, GraphCollection } from "./metadata/configurations";
import { numberLiteralTypeAnnotation } from "@babel/types";
import { DropdownButton, DomElementOperator, GraphOperator } from "./widgets/DomElements";

import { Synchronizer } from "./extras/synchronizer";

export class FgpGraph {

    private graphContainer: HTMLElement;

    private header: HTMLElement;

    private body: HTMLElement;

    private bottom: HTMLElement;

    private graph: Dygraph;

    private rangeBarGraph: Dygraph;

    private viewConfigs: Array<ViewConfig>;

    private defaultGraphRanges: Array<{ name: string, value: number, show?: boolean }>;

    private parentDom: HTMLElement;

    private viewsDropdown: HTMLElement;

    private intervalsDropdown: HTMLElement;

    private intervalLabelsArea: HTMLElement;

    private fieldPattern = new RegExp(/data[.]{1}[a-zA-Z0-9]+/g);

    // store locally
    private rangeBarData: any = [];


    constructor(dom: HTMLElement, viewConfigs: Array<ViewConfig>) {

        this.defaultGraphRanges = [
            { name: "3 days", value: (1000 * 60 * 60 * 24 * 3), show: true },
            { name: "7 days", value: 604800000, show: true },
            { name: "1 month", value: 2592000000, show: false }
        ];
        this.parentDom = dom;

        let viewsDropdownAttrs: Array<DomAttrs> = [{ key: 'class', value: "fgp-views-dropdown" }];
        this.viewsDropdown = DomElementOperator.createElement('select', viewsDropdownAttrs);

        let intervalsDropdownAttrs: Array<DomAttrs> = [{ key: 'class', value: "fgp-intervals-dropdown" }];
        this.intervalsDropdown = DomElementOperator.createElement('select', intervalsDropdownAttrs);

        let intervalsLabelsAttrs: Array<DomAttrs> = [{ key: 'class', value: "fgp-interval-labels" }];
        this.intervalLabelsArea = DomElementOperator.createElement('div', intervalsLabelsAttrs);

        let headerAttrs: Array<DomAttrs> = [{ key: 'class', value: 'fgp-graph-header' }];
        this.header = DomElementOperator.createElement('div', headerAttrs);
        this.header.appendChild(this.viewsDropdown);
        this.header.appendChild(this.intervalsDropdown);
        this.header.appendChild(this.intervalLabelsArea);
        // create doms
        let containerAttrs: Array<DomAttrs> = [{ key: 'class', value: 'fgp-graph-container' }];
        this.graphContainer = DomElementOperator.createElement('div', containerAttrs);
        this.graphContainer.appendChild(this.header);

        let bodyAttrs: Array<DomAttrs> = [{ key: 'class', value: 'fgp-graph-body' }];
        this.body = DomElementOperator.createElement('div', bodyAttrs);
        this.graphContainer.appendChild(this.body);
        this.parentDom.appendChild(this.graphContainer);
        this.viewConfigs = viewConfigs;
        this.initGraph();
    }

    /**
     * init graph with configuration
     *
     * @private
     * @memberof FgpGraph
     */
    private initGraph = () => {
        let operator: GraphOperator = new GraphOperator();
        // which "view" should be shown first? device or scatter?
        if (this.viewConfigs) {
            let showView: ViewConfig = null;
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
                console.debug("Current View: ", choosedView);
                // find view 
                this.viewConfigs.forEach(config => {
                    if (config.name === choosedView) {
                        operator.init(this.graph, this.rangeBarGraph, config, this.graphContainer, this.body, this.intervalsDropdown, this.header);
                    }
                });
            }

            if (showView) {
                operator.init(this.graph, this.rangeBarGraph, showView, this.graphContainer, this.body, this.intervalsDropdown, this.header);
            }
        }
    }
}