import Dygraph from "dygraphs";

import { DomAttrs, GraphConfig } from "./vo/attrs";

export class FgpGraph {

    private graphContainer: HTMLElement;

    private header: HTMLElement;

    private body: HTMLElement;

    private graph: Dygraph;


    constructor(dom: HTMLElement, config: GraphConfig) {
        let containerAttrs: Array<DomAttrs> = [new DomAttrs('class', 'fgp-graph-container')];
        this.graphContainer = this.createElement('div', containerAttrs);

        let headerAttrs: Array<DomAttrs> = [new DomAttrs('class', 'fgp-graph-header')];
        this.header = this.createElement('div', headerAttrs);

        let bodyAttrs: Array<DomAttrs> = [new DomAttrs('class', 'fgp-graph-body')];
        this.body = this.createElement('div', bodyAttrs);

        this.graphContainer.appendChild(this.header);
        this.graphContainer.appendChild(this.body);
        dom.appendChild(this.graphContainer);


        //
        this.initDeviceView(config);
    }

    private createElement = (type: string, attrs: Array<DomAttrs>): HTMLElement => {
        let dom: HTMLElement = document.createElement(type);
        // put attributes on element
        attrs.forEach(attr => {
            dom.setAttribute(attr.key, attr.value);
        });

        return dom;
    }


    /**
     * init device view
     *
     * @memberof FgpGraph
     */
    private initDeviceView = (config: GraphConfig) => {
        //
        this.generateDygraph(config);
    }

    /**
     * init scatter view directly 
     *
     * @memberof FgpGraph
     */
    private initScatterView = (config) => {

    }


    private generateDygraph = (config: GraphConfig) => {
        //
        this.graph = new Dygraph(this.body, config.data);

    }


}