import Dygraph from "dygraphs";
import {GraphCollection} from "../metadata/configurations";

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

    private collectionLabels: Array<HTMLSpanElement>;

    private opts: any;

    constructor(options: any) {
        this.opts = options;
        this.collectionLabels = [];
    }

    activate = (g: Dygraph) => {
        this.g = g;
        // only add once
        this.createCollectionBadges(this.opts.collections);

        return {
            layout: this.reserveSpaceTop
        };

    };


    private reserveSpaceTop = (e: Layout) => {
        e.reserveSpaceTop(30);
    };

    private addElementToGraph = (element: Element) => {
        const graphDiv: HTMLDivElement = (<any>this.g).graphDiv;
        graphDiv.append(element);
    };

    /**
     * Add collection badge on graph.
     * @param collections
     */
    private createCollectionBadges = (collections: Array<GraphCollection>) => {
        // create container first
        let badgesContainer:HTMLDivElement = document.createElement('div');
        badgesContainer.setAttribute("class", "fgp-interval-labels");
        badgesContainer.addEventListener("mousedown", (e:MouseEvent) =>{
            console.log("lock or unlock collection");
        });


        collections.forEach(coll => {
            let badge: HTMLSpanElement = document.createElement('span');
            badge.textContent = coll.label;
            badge.setAttribute("class", "badge badge-pill badge-secondary badge-interval");
            badge.setAttribute("data-interval-locked", "false");
            badge.setAttribute("data-interval-name", coll.label);
            badge.setAttribute("data-interval-value", coll.interval + '');
            badgesContainer.appendChild(badge);
            this.collectionLabels.push(badge);
        });

        // add container to graph
        this.addElementToGraph(badgesContainer);
    };

}