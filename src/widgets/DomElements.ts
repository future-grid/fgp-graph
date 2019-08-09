import Dygraph from 'dygraphs';
import { ViewConfig, GraphCollection, DomAttrs } from '../metadata/configurations';
import moment from 'moment-timezone';
import { Synchronizer } from '../extras/synchronizer';
import { DataHandler } from '../services/dataService';
import { GraphInteractions } from '../extras/interactions';
import { Formatters } from '../extras/formatters';
import { arrayExpression } from '@babel/types';

export class DropdownButton {

    private select: HTMLSelectElement;

    private btns: Array<{ id: string, label: string, selected?: boolean }>;
    constructor(select: HTMLSelectElement, buttons: Array<{ id: string, label: string, selected?: boolean }>) {
        this.select = select;
        this.btns = buttons;
    }

    /**
     * generate options
     *
     * @memberof DropdownButton
     */
    render = () => {
        // remove all first
        this.select.innerHTML = '';
        this.btns.forEach(element => {
            let opt: HTMLOptionElement = document.createElement('option');
            opt.text = element.label;
            opt.value = element.id;
            if (element.selected) {
                opt.selected = true;
            }
            // add it into select
            this.select.add(opt);
        });
    }
}


export class DomElementOperator {

    static createElement = (type: string, attrs: Array<DomAttrs>): HTMLElement => {
        let dom: HTMLElement = document.createElement(type);
        // put attributes on element
        attrs.forEach(attr => {
            dom.setAttribute(attr.key, attr.value);
        });

        return dom;
    }

}



export class GraphOperator {

    static fieldPattern = new RegExp(/data[.]{1}[a-zA-Z0-9]+/g);

    static defaultGraphRanges: Array<{ name: string, value: number, show?: boolean }> = [
        { name: "3 days", value: (1000 * 60 * 60 * 24 * 3), show: true },
        { name: "7 days", value: 604800000, show: true },
        { name: "1 month", value: 2592000000, show: false }
    ];

    static createElement = (type: string, attrs: Array<DomAttrs>): HTMLElement => {
        let dom: HTMLElement = document.createElement(type);
        // put attributes on element
        attrs.forEach(attr => {
            dom.setAttribute(attr.key, attr.value);
        });

        return dom;
    }

    static init = (mainGraph: Dygraph, rangeGraph: Dygraph, view: ViewConfig, graphContainer: HTMLElement, graphBody: HTMLElement, intervalsDropdown: HTMLElement) => {
        let formatters: Formatters = new Formatters(view.timezone ? view.timezone : moment.tz.guess());
        let entities: Array<string> = [];
        let bottomAttrs: Array<DomAttrs> = [{ key: 'class', value: 'fgp-graph-bottom' }];
        let bottom = null;

        view.graphConfig.entities.forEach(entity => {
            entities.push(entity.id);
        });

        // find fields from configuration
        let timewindowEnd: number = moment.tz(view.timezone ? view.timezone : moment.tz.guess()).add(1, 'days').startOf('day').valueOf();
        let timewindowStart: number = moment.tz(view.timezone ? view.timezone : moment.tz.guess()).subtract(7, 'days').startOf('day').valueOf();   // default 7 days
        const ranges: Array<{ name: string, value: number, show?: boolean }> = view.ranges;
        if (ranges.length > 0) {
            // get first "show" == true
            const selected = ranges.find((value, index, arr) => {
                if (value.show) {
                    return value;
                }
            });
            // not found then use first one
            if (!selected) {
                // just need to change start
                timewindowStart = moment.tz(view.timezone ? view.timezone : moment.tz.guess()).add(1, 'days').startOf('day').valueOf() - ranges[0].value;
            } else {
                timewindowStart = moment.tz(view.timezone ? view.timezone : moment.tz.guess()).add(1, 'days').startOf('day').valueOf() - selected.value;
            }
        }

        // which one should be shown first? base on current window size? or base on the collection config?

        // get default time range from graph config
        let graphRangesConfig = GraphOperator.defaultGraphRanges;
        if (view.ranges) {
            graphRangesConfig = view.ranges;
        }

        let dropdownOpts: Array<{ id: string, label: string, selected?: boolean }> = [];
        graphRangesConfig.forEach(config => {
            dropdownOpts.push(
                { id: config.name, label: config.name, selected: config.show }
            );
        });

        let choosedCollection: GraphCollection = null;

        const intervalsDropdonwOptions = new DropdownButton(<HTMLSelectElement>intervalsDropdown, [...dropdownOpts]);
        intervalsDropdonwOptions.render();

        intervalsDropdown.onchange = (e) => {
            const intervalDropdown: HTMLSelectElement = <HTMLSelectElement>e.currentTarget;
            graphRangesConfig.forEach(config => {
                if (config.name === intervalDropdown.value) {
                    rangeGraph.updateOptions({
                        dateWindow: [new Date(timewindowEnd - config.value), new Date(timewindowEnd)]
                    });

                    GraphOperator.update(mainGraph, rangeGraph, view, choosedCollection, view.graphConfig.rangeCollection, (timewindowEnd - config.value), timewindowEnd);
                }
            });
        };

        // get fields
        let fieldsForCollection = [];
        // get range config and find the first and last
        view.graphConfig.rangeCollection.series.forEach(series => {
            let _tempFields = (series.exp).match(GraphOperator.fieldPattern);
            // replace all "data."" with ""
            _tempFields = _tempFields.map(exp => exp.replace("data.", ""));
            // put fields together
            fieldsForCollection = fieldsForCollection.concat(_tempFields);
        });

        view.dataService.fetchFirstNLast(entities, view.graphConfig.rangeCollection.name, Array.from(new Set(fieldsForCollection))).then(resp => {
            // get first and last records, just need start and end timestamp
            let first: any = { timestamp: moment.tz(view.timezone ? view.timezone : moment.tz.guess()).valueOf() };
            let last: any = { timestamp: 0 };
            // get all first and last then find out which first is the smalllest and last is the largest
            entities.forEach(entity => {
                //
                resp.forEach(entityData => {
                    if (entityData.id === entity) {
                        if (entityData.data && entityData.data.first && entityData.data.first.timestamp) {
                            //
                            if (first.timestamp > entityData.data.first.timestamp) {
                                first = entityData.data.first;
                            }
                        }

                        if (entityData.data && entityData.data.last && entityData.data.last.timestamp) {
                            //
                            if (last.timestamp < entityData.data.last.timestamp) {
                                last = entityData.data.last;
                            }
                        }
                    }
                });
            });

            // init empty graph with start and end  no other data
            let firstRanges = graphRangesConfig.find(range => range.show && range.show == true);
            if (!firstRanges) {
                // throw errors;
                throw new Error("non default range for range-bar!");
            }


            // get fields and labels
            view.graphConfig.collections.forEach(collection => {
                // if there is a config for what level need to show.
                if (collection.threshold && firstRanges.value) {
                    //  >= && <    [ in the middle  )
                    if (firstRanges.value >= collection.threshold.min && firstRanges.value < collection.threshold.max) {
                        choosedCollection = collection;
                    }
                }
            });

            // get choosed collection by width....
            if (!choosedCollection && firstRanges) {
                // cal with width
                const width: number = graphContainer.offsetWidth;
                //
                const pointsCanBeShown: number = Math.round(width * .9);
                view.graphConfig.collections.forEach(collection => {
                    // how many points in this interval
                    if ((firstRanges.value / collection.interval) <= pointsCanBeShown) {
                        if (!choosedCollection) {
                            choosedCollection = collection;
                        } else if (choosedCollection.interval > collection.interval) {
                            choosedCollection = collection;
                        }
                    }
                });
            }
            let initialData = [[new Date(first.timestamp)], [new Date(last.timestamp)]];
            let isY2: boolean = false;
            let mainGraphLabels: Array<string> = [];
            let mainGraphSeries: any = null;
            if (entities.length == 1) {
                mainGraphLabels = [];
                mainGraphSeries = {};
                choosedCollection.series.forEach((series, _index) => {
                    mainGraphLabels.push(series.label);
                    initialData.forEach(_data => {
                        _data[_index + 1] = null;
                    });
                    mainGraphSeries[series.label] = {
                        axis: series.yIndex == 'left' ? 'y' : 'y2'
                    };
                    if (series.yIndex == "right") {
                        isY2 = true;
                    }
                });

            } else if (entities.length > 1 && choosedCollection.series && choosedCollection.series[0]) {
                mainGraphLabels = [];
                entities.forEach((entity, _index) => {
                    mainGraphLabels.push(entity);
                    initialData.forEach(_data => {
                        _data[_index + 1] = null;
                    });
                });
            }

            let yScale = null;
            let y2Scale = null;
            // check if there is a init scale
            if (choosedCollection.initScales) {
                if (choosedCollection.initScales.left) {
                    yScale = {
                        valueRange: [choosedCollection.initScales.left.min, choosedCollection.initScales.left.max]
                    };
                }
                if (choosedCollection.initScales.right) {
                    y2Scale = {
                        valueRange: [choosedCollection.initScales.right.min, choosedCollection.initScales.right.max]
                    };
                }

            }

            mainGraph = new Dygraph(graphBody, initialData, {
                labels: ['x'].concat(mainGraphLabels),
                ylabel: choosedCollection.yLabel,
                y2label: choosedCollection.y2Label,
                series: mainGraphSeries,
                showRangeSelector: view.graphConfig.features.rangeBar && !view.graphConfig.rangeCollection,
                rangeSelectorHeight: 30,
                legend: "follow",
                legendFormatter: view.graphConfig.features.legend ? view.graphConfig.features.legend : formatters.legendForSingleSeries,
                labelsKMB: true,
                axes: {
                    x: {
                        axisLabelFormatter: formatters.axisLabel
                    },
                    y: yScale,
                    y2: y2Scale
                },
                highlightSeriesOpts: { strokeWidth: 1 },
                interactionModel: {
                    'mousedown': GraphInteractions.mouseDown,
                    'mouseup': GraphInteractions.mouseUp
                },
                underlayCallback: (context, area, graph) => {
                    console.debug("!");
                }
            });
            // remove first
            if (graphContainer.getElementsByClassName("fgp-graph-bottom").length > 0) {
                let bottoms = graphContainer.getElementsByClassName("fgp-graph-bottom");
                for (var i = 0; i < bottoms.length; i++) {
                    graphContainer.removeChild(bottoms[i]);
                }
            }
            // range-bar?
            if (view.graphConfig.features.rangeBar && view.graphConfig.rangeCollection) {
                let labels: Array<string> = [];
                let firstData = [new Date(first.timestamp)];
                let lastData = [new Date(last.timestamp)];
                let rangeSeries = null;

                if (entities.length == 1) {
                    rangeSeries = {};
                    // check if ther is a y2
                    view.graphConfig.rangeCollection.series.forEach((series, _index) => {
                        labels.push(series.label);
                        firstData[_index + 1] = null;
                        lastData[_index + 1] = null;
                        rangeSeries[series.label] = {
                            axis: (series.yIndex == "left" || !series.yIndex) ? 'y' : 'y2'
                        };
                    });

                    if (isY2) {
                        labels.push("y2");
                        rangeSeries["y2"] = {
                            axis: "y2"
                        };
                        firstData.push(null);
                        lastData.push(null);
                    }

                } else if (entities.length > 1 && view.graphConfig.rangeCollection.series && view.graphConfig.rangeCollection.series[0]) {
                    // 
                    entities.forEach((entity, _index) => {
                        labels.push(entity);
                        firstData[_index + 1] = null;
                        lastData[_index + 1] = null;
                    });
                }

                // create 2 labels for start and end
                let dateLabelLeftAttrs: Array<DomAttrs> = [{ key: 'class', value: 'fgp-graph-range-bar-date-label-left' }];
                let startLabelLeft: HTMLElement = DomElementOperator.createElement('label', dateLabelLeftAttrs);
                let dateLabelRightAttrs: Array<DomAttrs> = [{ key: 'class', value: 'fgp-graph-range-bar-date-label-right' }];
                let endLabelRight: HTMLElement = DomElementOperator.createElement('label', dateLabelRightAttrs);
                let dateLabels: HTMLElement = DomElementOperator.createElement('div', [{ key: 'style', value: 'height:20px;' }]);
                dateLabels.appendChild(startLabelLeft);
                dateLabels.appendChild(endLabelRight);
                bottom = DomElementOperator.createElement('div', bottomAttrs);
                bottom.appendChild(dateLabels);
                let rangeBarAttrs: Array<DomAttrs> = [{ key: 'class', value: 'fgp-graph-rangebar' }];
                let rangeBar: HTMLElement = DomElementOperator.createElement('div', rangeBarAttrs);
                bottom.appendChild(rangeBar);
                graphContainer.appendChild(bottom);
                //create range-bar graph
                rangeGraph = new Dygraph(rangeBar, [
                    firstData,   // first
                    lastData    // last
                ], {
                        xAxisHeight: 0,
                        axes: { x: { drawAxis: false } },
                        labels: ['x'].concat(labels),
                        series: rangeSeries,
                        showRangeSelector: true,
                        rangeSelectorHeight: 30,
                        legend: 'never',
                        drawCallback: (dygraph, is_initial) => {
                            const xAxisRange: Array<number> = dygraph.xAxisRange();
                            startLabelLeft.innerHTML = moment.tz(xAxisRange[0], view.timezone ? view.timezone : moment.tz.guess()).format('lll z');
                            endLabelRight.innerHTML = moment.tz(xAxisRange[1], view.timezone ? view.timezone : moment.tz.guess()).format('lll z');
                        }
                    });

                // check 
                Synchronizer.synchronize([rangeGraph, mainGraph, {
                    zoom: true,
                    selection: false
                }]);

                let rangeBarCanvas = (rangeBar.getElementsByClassName("dygraph-rangesel-fgcanvas")[0]);
                let rangeBarHandles = rangeBar.getElementsByClassName("dygraph-rangesel-zoomhandle");
                let currentDatewindowOnMouseDown = [];

                const rangebarDatewindowChangeFunc = (e) => {
                    const datewindow = rangeGraph.xAxisRange();
                    // check
                    console.debug("range bar up~", datewindow);

                    if (datewindow[0] instanceof Date) {
                        datewindow[0] = datewindow[0].getTime();
                    }

                    if (datewindow[1] instanceof Date) {
                        datewindow[1] = datewindow[1].getTime();
                    }

                    if (datewindow[0] == currentDatewindowOnMouseDown[0] && datewindow[1] == currentDatewindowOnMouseDown[1]) {
                        console.debug("no change!");
                    } else {
                        // fetch data again 
                        // sorting
                        view.graphConfig.collections.sort((a, b) => {
                            return a.interval > b.interval ? 1 : -1;
                        });


                        choosedCollection = view.graphConfig.collections.find((collection) => {
                            return collection.threshold && (datewindow[1] - datewindow[0]) <= (collection.threshold.max);
                        });


                        console.debug("choosed:" + choosedCollection.name);
                        GraphOperator.update(mainGraph, rangeGraph, view, choosedCollection, view.graphConfig.rangeCollection, datewindow[0], datewindow[1]);
                    }

                }

                const rangebarMousedownFunc = (e) => {
                    // check
                    const datewindow = rangeGraph.xAxisRange();
                    if (datewindow[0] instanceof Date) {
                        datewindow[0] = datewindow[0].getTime();
                    }

                    if (datewindow[1] instanceof Date) {
                        datewindow[1] = datewindow[1].getTime();
                    }
                    currentDatewindowOnMouseDown = datewindow;

                    window.addEventListener("mouseup", rangebarDatewindowChangeFunc, {
                        once: true
                    });
                    console.debug("range bar down~", currentDatewindowOnMouseDown);
                }


                for (let i = 0; i < rangeBarHandles.length; i++) {
                    const element = rangeBarHandles[i];
                    element.addEventListener('mousedown', rangebarMousedownFunc);
                }

                // add mouse listener 
                rangeBarCanvas.addEventListener('mousedown', rangebarMousedownFunc);
            }
            // update datewindow
            mainGraph.updateOptions({
                dateWindow: [new Date(timewindowStart), new Date(timewindowEnd)]
            });

            GraphOperator.update(mainGraph, rangeGraph, view, choosedCollection, view.graphConfig.rangeCollection, timewindowStart, timewindowEnd);

        });
    }





    static update = (mainGraph: Dygraph, rangebarGraph: Dygraph, view: ViewConfig, graphCollection: GraphCollection, rangeCollection: GraphCollection, start: number, end: number) => {
        let formatters: Formatters = new Formatters(view.timezone ? view.timezone : moment.tz.guess());
        // get data for main graph
        // main graph entities
        const mainEntities: Array<string> = [];
        view.graphConfig.entities.forEach(entity => {
            mainEntities.push(entity.id);
        });

        // get fields for main graph
        let fieldsForMainGraph = [];

        graphCollection.series.forEach(series => {
            let _tempFields = (series.exp).match(GraphOperator.fieldPattern);
            // replace all "data."" with ""
            _tempFields = _tempFields.map(exp => exp.replace("data.", ""));
            // put fields together
            fieldsForMainGraph = fieldsForMainGraph.concat(_tempFields);
        });


        let prepareGraphData = (data, entities, collection): { data: Array<any>, axis?: { y: { min: number, max: number }, y2?: { min: number, max: number } } } => {

            let yAxis = { min: null, max: null };
            let yAxis2 = { min: null, max: null };

            let yIndexs: Array<number> = [];
            let y2Indexs: Array<number> = [];
            collection.series.forEach((series, _index) => {
                if (series.yIndex && series.yIndex == 'right') {
                    // right
                    y2Indexs.push(_index + 1);
                } else if (!series.yIndex || series.yIndex == 'left') {
                    // left
                    yIndexs.push(_index + 1);
                }
            });


            // update main graph
            let graphData = [];
            let finalData = [];
            let _dates: Array<number> = [];

            data.forEach(entityData => {
                entities.forEach(id => {
                    if (id == entityData.id) {
                        graphData.push(entityData.data);
                        // merge date 
                        entityData.data.forEach(item => {  // item is object
                            if (_dates.indexOf(item.timestamp) == -1) {
                                _dates.push(item.timestamp);
                            }
                        });
                    }
                });
            });



            if (entities.length == 1) {
                // get collection config
                collection.series.forEach((series, _index) => {
                    var f = new Function("data", "with(data) { if(" + series.exp + "!=null)return " + series.exp + ";return null;}");
                    // generate data for this column
                    _dates.forEach(date => {
                        // find date in finalData
                        let point = finalData.find(record => record[0].getTime() === date);
                        let record = graphData[0].find(data => data.timestamp === date);

                        if (point) {
                            point[_index + 1] = f(record);
                        } else {
                            point = [new Date(date)];
                            point[_index + 1] = f(record);
                            finalData.push(point);
                        }

                        // update min max for current field
                        // left 
                        yIndexs.forEach(_yIndex => {
                            if (_yIndex == (_index + 1)) {
                                //
                                if (yAxis.min) {
                                    // compare and put the value
                                    yAxis.min = yAxis.min > point[_index + 1] ? point[_index + 1] : yAxis.min;
                                } else {
                                    yAxis.min = point[_index + 1];
                                }

                                if (yAxis.max) {
                                    // compare and put the value
                                    yAxis.max = yAxis.max < point[_index + 1] ? point[_index + 1] : yAxis.max;
                                } else {
                                    yAxis.max = point[_index + 1];
                                }
                            }
                        });

                        // right 
                        y2Indexs.forEach(_yIndex => {
                            if (_yIndex == (_index + 1)) {
                                //
                                if (yAxis2.min) {
                                    // compare and put the value
                                    yAxis2.min = yAxis2.min > point[_index + 1] ? point[_index + 1] : yAxis2.min;
                                } else {
                                    yAxis2.min = point[_index + 1];
                                }

                                if (yAxis2.max) {
                                    // compare and put the value
                                    yAxis2.max = yAxis2.max < point[_index + 1] ? point[_index + 1] : yAxis2.max;
                                } else {
                                    yAxis2.max = point[_index + 1];
                                }
                            }
                        });

                    });

                });
            } else if (entities.length > 1 && collection.series && collection.series[0]) {
                const exp = collection.series[0].exp;
                var f = new Function("data", "with(data) { if(" + exp + "!=null)return " + exp + ";return null;}");
                _dates.forEach(date => {
                    // get the record
                    let point = finalData.find(record => record[0].getTime() === date);
                    // if not found just add it as new one.
                    if (!point) {
                        point = [new Date(date)];
                        finalData.push(point);
                    }

                    entities.forEach((entity, _index) => {
                        let record = graphData[_index].find(data => data.timestamp === date);
                        point[_index + 1] = f(record);

                        yIndexs.forEach(_yIndex => {
                            if (_yIndex == (_index + 1)) {
                                //
                                if (yAxis.min) {
                                    // compare and put the value
                                    yAxis.min = yAxis.min > point[_index + 1] ? point[_index + 1] : yAxis.min;
                                } else {
                                    yAxis.min = point[_index + 1];
                                }

                                if (yAxis.max) {
                                    // compare and put the value
                                    yAxis.max = yAxis.max < point[_index + 1] ? point[_index + 1] : yAxis.max;
                                } else {
                                    yAxis.max = point[_index + 1];
                                }
                            }
                        });

                        // right 
                        y2Indexs.forEach(_yIndex => {
                            if (_yIndex == (_index + 1)) {
                                //
                                if (yAxis2.min) {
                                    // compare and put the value
                                    yAxis2.min = yAxis2.min > point[_index + 1] ? point[_index + 1] : yAxis2.min;
                                } else {
                                    yAxis2.min = point[_index + 1];
                                }

                                if (yAxis2.max) {
                                    // compare and put the value
                                    yAxis2.max = yAxis2.max < point[_index + 1] ? point[_index + 1] : yAxis2.max;
                                } else {
                                    yAxis2.max = point[_index + 1];
                                }
                            }
                        });

                    });
                });
            }

            return { data: finalData, axis: { y: yAxis, y2: yAxis2 } };
        }

        // get data for 
        view.dataService.fetchdata(mainEntities, graphCollection.name, { start: start, end: end }, Array.from(new Set(fieldsForMainGraph))).then(resp => {

            let graphData = prepareGraphData(resp, mainEntities, graphCollection);
            let yScale = null;
            let y2Scale = null;
            // get init scale
            if (!graphCollection.initScales) {
                if (graphData.axis) {
                    if (graphData.axis.y) {
                        yScale = {
                            valueRange: [graphData.axis.y.min * 0.97, graphData.axis.y.max * 1.03]
                        }
                    }

                    if (graphData.axis.y2) {
                        y2Scale = {
                            valueRange: [graphData.axis.y2.min * 0.97, graphData.axis.y2.max * 1.03]
                        }
                    }
                }
            } else {
                // check if there is a init scale
                if (graphCollection.initScales.left) {
                    yScale = {
                        valueRange: [graphCollection.initScales.left.min, graphCollection.initScales.left.max]
                    };
                }
                if (graphCollection.initScales.right) {
                    y2Scale = {
                        valueRange: [graphCollection.initScales.right.min, graphCollection.initScales.right.max]
                    };
                }
            }
            console.debug(yScale, y2Scale);
            // update main graph
            mainGraph.updateOptions({
                file: graphData.data,
                axes: {
                    x: {
                        axisLabelFormatter: formatters.axisLabel
                    },
                    y: yScale,
                    y2: y2Scale
                },
            });

        });

        // get fields for range-bar 
        const rangeEntities: Array<string> = [view.graphConfig.rangeEntity.id];
        // get fields for main graph
        let fieldsForRangebarGraph = [];

        rangeCollection.series.forEach(series => {
            let _tempFields = (series.exp).match(GraphOperator.fieldPattern);
            // replace all "data."" with ""
            _tempFields = _tempFields.map(exp => exp.replace("data.", ""));
            // put fields together
            fieldsForRangebarGraph = fieldsForRangebarGraph.concat(_tempFields);
        });

        //
        view.dataService.fetchdata(rangeEntities, rangeCollection.name, { start: start, end: end }, Array.from(new Set(fieldsForRangebarGraph))).then(resp => {

            // merge data
            const currentDatewindowData = prepareGraphData(resp, rangeEntities, rangeCollection);
            let preData: Array<any> = rangebarGraph.file_;
            currentDatewindowData.data.forEach(_data => {
                let _exist: number = -1;
                preData.forEach((_oldData, _index) => {
                    if (_oldData[0].getTime() == _data[0].getTime()) {
                        _exist = _index;
                    }
                });
                if (_exist != -1) {
                    // replace
                    preData.splice(_exist, 1, _data);
                } else {
                    // add data before the last one
                    preData.push(_data);
                }
            });
            // sorting
            preData.sort((a, b) => {
                return a[0].getTime() > b[0].getTime() ? 1 : -1;
            });
            rangebarGraph.updateOptions({
                file: preData
            });

        });


    }

}
