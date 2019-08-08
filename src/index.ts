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

    private viewButtons: Array<string>;

    private defaultGraphRanges: Array<{ name: string, value: number, show?: boolean }>;

    private parentDom: HTMLElement;

    private viewsDropdown: HTMLElement;

    private intervalsDropdown: HTMLElement;

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

        let headerAttrs: Array<DomAttrs> = [{ key: 'class', value: 'fgp-graph-header' }];
        this.header = DomElementOperator.createElement('div', headerAttrs);
        this.header.appendChild(this.viewsDropdown);
        this.header.appendChild(this.intervalsDropdown);
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
                        GraphOperator.init(this.graph, this.rangeBarGraph, config, this.graphContainer, this.body, this.intervalsDropdown);
                    }
                });
            }

            if (showView) {
                GraphOperator.init(this.graph, this.rangeBarGraph, showView, this.graphContainer, this.body, this.intervalsDropdown);
            }
        }
    }


    private initDygraph = (view: ViewConfig) => {


        // fetching real data for range-bar and main graph






        // // get data for current interval
        // const patt = new RegExp(/data[.]{1}[a-zA-Z0-9]+/g);
        // // create graph with empty first and last data first.
        // choosedCollection.series.forEach(series => {
        //     let _tempFields = (series.exp).match(patt);
        //     // replace all "data."" with ""
        //     _tempFields = _tempFields.map(exp => exp.replace("data.", ""));
        //     // put fields together
        //     fieldsForCollection = fieldsForCollection.concat(_tempFields);
        // });

        // fields.push({ collection: choosedCollection.label, fields: fieldsForCollection });




        // get data
        // view.dataService.fetchdata(entities, choosedCollection.name, { start: timewindowStart, end: timewindowEnd }, Array.from(new Set(fieldsForCollection))).then(resp => {
        //     // if get data back?
        //     if (resp) {
        //         let graphData = [];
        //         let _dates: Array<number> = [];
        //         resp.forEach(entityData => {
        //             entities.forEach(id => {
        //                 if (id == entityData.id) {
        //                     graphData.push(entityData.data);
        //                     // merge date 
        //                     entityData.data.forEach(item => {  // item is object
        //                         if (_dates.indexOf(item.timestamp) == -1) {
        //                             _dates.push(item.timestamp);
        //                         }
        //                     });
        //                 }
        //             });
        //         });


        //         let finalData = [];
        //         // use function to get data from records
        //         if (entities.length == 1) {
        //             labels = [];
        //             // single device
        //             // get collection config
        //             choosedCollection.series.forEach((series, _index) => {
        //                 labels.push(series.label);
        //                 var f = new Function("data", "with(data) { if(" + series.exp + "!=null)return " + series.exp + ";return null;}");
        //                 // generate data for this column
        //                 _dates.forEach(date => {
        //                     // find date in finalData
        //                     let point = finalData.find(record => record[0].getTime() === date);
        //                     let record = graphData[0].find(data => data.timestamp === date);

        //                     if (point) {
        //                         point[_index + 1] = f(record);
        //                     } else {
        //                         point = [new Date(date)];
        //                         point[_index + 1] = f(record);
        //                         finalData.push(point);
        //                     }
        //                 });
        //             });
        //         } else if (entities.length > 1 && choosedCollection.series && choosedCollection.series[0]) {
        //             labels = [];
        //             entities.forEach(entity => {
        //                 labels.push(entity);
        //             });
        //             // series must only have one. entity name is the series name
        //             const exp = choosedCollection.series[0].exp;
        //             var f = new Function("data", "with(data) { if(" + exp + "!=null)return " + exp + ";return null;}");
        //             _dates.forEach(date => {
        //                 // get the record
        //                 let point = finalData.find(record => record[0].getTime() === date);

        //                 // if not found just add it as new one.
        //                 if (!point) {
        //                     point = [new Date(date)];
        //                     finalData.push(point);
        //                 }

        //                 entities.forEach((entity, _index) => {
        //                     let record = graphData[_index].find(data => data.timestamp === date);
        //                     point[_index + 1] = f(record);
        //                 });
        //             });
        //         }
        //         // change datewindow
        //         this.graph = new Dygraph(this.body, finalData, {
        //             labels: ['x'].concat(labels),
        //             showRangeSelector: view.graphConfig.features.rangeBar && !view.graphConfig.rangeCollection,
        //             rangeSelectorHeight: 30,
        //             // interactionModel: {

        //             // }
        //         });

        //         Synchronizer.synchronize([this.rangeBarGraph, this.graph, {
        //             zoom: true,
        //             selection: false
        //         }]);

        //         //


        //     }

        // }).catch(error => {
        //     // remove graph and show error message instead.

        // });

    }

}