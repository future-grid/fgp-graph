import Dygraph from 'dygraphs';
import { ViewConfig, GraphCollection, DomAttrs, GraphSeries, Entity } from '../metadata/configurations';
import moment from 'moment-timezone';
import { Synchronizer } from '../extras/synchronizer';
import { DataHandler } from '../services/dataService';
import { GraphInteractions } from '../extras/interactions';
import { Formatters } from '../extras/formatters';
import { arrayExpression } from '@babel/types';

export class DropdownButton {

    private select: HTMLSelectElement;

    private btns: Array<{ id: string, label: string, selected?: boolean }>;
    constructor(select: HTMLSelectElement, buttons: Array<{ id: string, label: string, selected?: boolean, formatter?: any }>) {
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


export class DropdownMenu {
    private dropdown: HTMLElement; // div
    private opts: Array<{ checked: boolean, name: string, label: string }>;
    private callback: any;

    constructor(dropdownArea: HTMLElement, opts: Array<{ checked: boolean, name: string, label: string }>, callback: any) {
        this.dropdown = dropdownArea;
        this.opts = opts;
        this.callback = callback;
    }
    render = () => {
        this.dropdown.innerHTML = '';
        let div: HTMLElement = document.createElement('div');
        div.setAttribute("class", "fgp-graphs-dropdown");
        //
        let span: HTMLElement = document.createElement('div');
        span.innerHTML = `
        <select>
            <option disabled selected>series</option>
        </select>`;
        let content: HTMLElement = document.createElement('ul');
        content.setAttribute('class', "dropdown-content");

        // add options
        this.opts.forEach(opt => {
            // create li
            let li: HTMLElement = document.createElement('li');
            let checkbox: HTMLElement = document.createElement('input');
            checkbox.setAttribute("type", "checkbox");
            if (opt.checked) {
                checkbox.setAttribute("checked", "checked");
                checkbox.setAttribute("data-value", opt.label);
            }
            checkbox.addEventListener("click", (e) => {
                //
                let series = (<HTMLInputElement>e.target).getAttribute("data-value");
                let checked = (<HTMLInputElement>e.target).checked;
                // console.debug("series: ", series, checked);
                // update graph with callback function
                this.callback(series, checked);
            });
            li.appendChild(checkbox);
            li.append(' ' + opt.label);
            content.appendChild(li);
        });
        //
        div.appendChild(span);
        div.appendChild(content);
        this.dropdown.appendChild(div);
    }
}


export class SelectWithCheckbox {

    private select: HTMLSelectElement;
    private opts: Array<{ checked: boolean, name: string, label: string }>;

    constructor(select: HTMLSelectElement, opts: Array<{ checked: boolean, name: string, label: string }>) {
        this.select = select;
        this.opts = opts;
    }

    render = () => {
        this.select.innerHTML = "";
        // create options
        this.opts.forEach(opt => {
            let optElement: HTMLOptionElement = document.createElement('option');
            let checkbox: HTMLInputElement = document.createElement('input');
            checkbox.setAttribute("type", "checkbox");
            optElement.appendChild(checkbox);
            optElement.append(opt.label);
            this.select.add(optElement);
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

    public static FIELD_PATTERN = new RegExp(/data[.]{1}[a-zA-Z0-9]+/g);

    defaultGraphRanges: Array<{ name: string, value: number, show?: boolean }> = [
        { name: "3 days", value: (1000 * 60 * 60 * 24 * 3), show: true },
        { name: "7 days", value: 604800000, show: true },
        { name: "1 month", value: 2592000000, show: false }
    ];

    createElement = (type: string, attrs: Array<DomAttrs>): HTMLElement => {
        let dom: HTMLElement = document.createElement(type);
        // put attributes on element
        attrs.forEach(attr => {
            dom.setAttribute(attr.key, attr.value);
        });

        return dom;
    }

    private mainGraph: Dygraph;

    private ragnebarGraph: Dygraph;

    private currentView: ViewConfig;

    private currentCollection: GraphCollection;

    private rangeCollection: GraphCollection;

    private start: number;

    private end: number;

    public datewindowCallback: any;

    private graphContainer: HTMLElement;
    private graphBody: HTMLElement;
    private intervalsDropdown: HTMLElement;
    private header: HTMLElement;

    private yAxisRanges = [];

    constructor(mainGraph: Dygraph, rangeGraph: Dygraph, graphContainer: HTMLElement, graphBody: HTMLElement, intervalsDropdown: HTMLElement, header: HTMLElement, datewindowCallback: any) {
        this.mainGraph = mainGraph;
        this.ragnebarGraph = rangeGraph;
        this.graphContainer = graphContainer;
        this.datewindowCallback = datewindowCallback;
        this.graphBody = graphBody;
        this.intervalsDropdown = intervalsDropdown;
        this.header = header
    }

    /**
     * update labels
     *
     * @private
     * @memberof GraphOperator
     */
    private updateCollectionLabels = (header: HTMLElement, entities: Array<Entity>, choosedCollection: GraphCollection, collections: Array<GraphCollection>) => {
        // 
        let labels = header.getElementsByClassName('fgp-interval-labels');// should only have one.
        let firstLabelArea: any = null;
        for (let i = 0; i < labels.length; i++) {
            const element = labels[i];
            element.innerHTML = ''; // remove all child
            if (i == 0) {
                firstLabelArea = element;
            }
        }

        // add children
        collections.forEach(_collection => {
            //
            let labelAttrs: Array<DomAttrs> = [{ key: 'class', value: 'badge badge-pill badge-secondary' }];
            if (_collection.name == choosedCollection.name) {
                labelAttrs = [{ key: 'class', value: 'badge badge-pill badge-success' }];
            }
            let label: HTMLElement = this.createElement('span', labelAttrs);
            label.innerText = _collection.label;
            firstLabelArea.appendChild(label);
        });


    }


    private updateSeriesDropdown = (header: HTMLElement, series: Array<any>, graph: Dygraph) => {
        let dropdown = header.getElementsByClassName('fgp-series-dropdown');// should only have one.

        if (dropdown && dropdown[0]) {
            dropdown[0].innerHTML = "";
        }
        let select: HTMLElement = <HTMLSelectElement>this.createElement("div", []);
        dropdown[0].appendChild(select);

        let opts: Array<{ checked: boolean, name: string, label: string }> = [];
        series.forEach(_series => {

            opts.push(
                { checked: true, name: _series, label: _series }
            );
        });

        // new SelectWithCheckbox(select, opts).render();

        new DropdownMenu(select, opts, (series, checked) => {
            let visibility: Array<boolean> = graph.getOption('visibility');
            let labels: Array<string> = graph.getLabels();

            labels.forEach((label, index) => {
                if (label == series) {
                    visibility[index - 1] = checked;
                }
            });
            graph.updateOptions({
                visibility: visibility
            });

        }).render();
    }




    init = (view: ViewConfig, readyCallback?: any, interactionCallback?: any) => {
        this.currentView = view;
        let formatters: Formatters = new Formatters(this.currentView.timezone ? this.currentView.timezone : moment.tz.guess());
        let entities: Array<string> = [];
        let bottomAttrs: Array<DomAttrs> = [{ key: 'class', value: 'fgp-graph-bottom' }];
        let bottom = null;

        this.currentView.graphConfig.entities.forEach(entity => {
            entities.push(entity.id);
        });

        // find fields from configuration
        let timewindowEnd: number = moment.tz(this.currentView.timezone ? this.currentView.timezone : moment.tz.guess()).add(1, 'days').startOf('day').valueOf();
        let timewindowStart: number = moment.tz(this.currentView.timezone ? this.currentView.timezone : moment.tz.guess()).subtract(7, 'days').startOf('day').valueOf();   // default 7 days
        const ranges: Array<{ name: string, value: number, show?: boolean }> = this.currentView.ranges;
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
                timewindowStart = moment.tz(this.currentView.timezone ? this.currentView.timezone : moment.tz.guess()).add(1, 'days').startOf('day').valueOf() - ranges[0].value;
            } else {
                timewindowStart = moment.tz(this.currentView.timezone ? this.currentView.timezone : moment.tz.guess()).add(1, 'days').startOf('day').valueOf() - selected.value;
            }
        }

        // which one should be shown first? base on current window size? or base on the collection config?

        // get default time range from graph config
        let graphRangesConfig = this.defaultGraphRanges;
        if (this.currentView.ranges) {
            graphRangesConfig = this.currentView.ranges;
        }

        let dropdownOpts: Array<{ id: string, label: string, selected?: boolean }> = [];
        graphRangesConfig.forEach(config => {
            dropdownOpts.push(
                { id: config.name, label: config.name, selected: config.show }
            );
        });

        let choosedCollection: GraphCollection = null;

        const intervalsDropdonwOptions = new DropdownButton(<HTMLSelectElement>this.intervalsDropdown, [...dropdownOpts]);
        intervalsDropdonwOptions.render();

        this.intervalsDropdown.onchange = (e) => {
            const intervalDropdown: HTMLSelectElement = <HTMLSelectElement>e.currentTarget;
            graphRangesConfig.forEach(config => {
                if (config.name == intervalDropdown.value) {
                    this.ragnebarGraph.updateOptions({
                        dateWindow: [new Date(timewindowEnd - config.value), new Date(timewindowEnd)]
                    });
                    // find the correct collection and update graph
                    choosedCollection = this.currentView.graphConfig.collections.find((collection) => {
                        return collection.threshold && (timewindowEnd - (timewindowEnd - config.value)) <= (collection.threshold.max);
                    });

                    //update 
                    this.mainGraph = this.mainGraph;
                    this.ragnebarGraph = this.ragnebarGraph;
                    this.currentCollection = choosedCollection;
                    this.currentView = this.currentView;
                    this.rangeCollection = this.currentView.graphConfig.rangeCollection;
                    this.start = (timewindowEnd - config.value);
                    this.end = timewindowEnd;

                    this.update();
                    this.updateCollectionLabels(this.header, this.currentView.graphConfig.entities, choosedCollection, this.currentView.graphConfig.collections);
                    if (interactionCallback) {
                        // ready to update children
                        interactionCallback();
                    }
                }
            });
        };

        // get fields
        let fieldsForCollection = [];
        // get range config and find the first and last
        this.currentView.graphConfig.rangeCollection.series.forEach(series => {
            let _tempFields = (series.exp).match(GraphOperator.FIELD_PATTERN);
            // replace all "data."" with ""
            _tempFields = _tempFields.map(exp => exp.replace("data.", ""));
            // put fields together
            fieldsForCollection = fieldsForCollection.concat(_tempFields);
        });


        // 
        this.currentView.dataService.fetchFirstNLast(entities, this.currentView.graphConfig.rangeCollection.name, Array.from(new Set(fieldsForCollection))).then(resp => {
            // get first and last records, just need start and end timestamp
            let first: any = { timestamp: moment.tz(this.currentView.timezone ? this.currentView.timezone : moment.tz.guess()).valueOf() };
            let last: any = { timestamp: 0 };
            // get all first and last then find out which first is the smalllest and last is the largest
            entities.forEach(entity => {
                //
                resp.forEach(entityData => {
                    if (entityData.id == entity) {
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
            this.currentView.graphConfig.collections.forEach(collection => {
                // if there is a config for what level need to show.
                if (collection.threshold && firstRanges.value) {
                    //  >= && <    [ in the middle  )
                    if (firstRanges.value >= collection.threshold.min && firstRanges.value < collection.threshold.max) {
                        this.currentCollection = choosedCollection = collection;

                    }
                }
            });

            // get choosed collection by width....
            if (!choosedCollection && firstRanges) {
                // cal with width
                const width: number = this.graphContainer.offsetWidth;
                //
                const pointsCanBeShown: number = Math.round(width * .9);
                this.currentView.graphConfig.collections.forEach(collection => {
                    // how many points in this interval
                    if ((firstRanges.value / collection.interval) <= pointsCanBeShown) {
                        if (!choosedCollection) {
                            this.currentCollection = choosedCollection = collection;
                        } else if (choosedCollection.interval > collection.interval) {
                            this.currentCollection = choosedCollection = collection;
                        }
                    }
                });
            }

            let initialData = [[new Date(first.timestamp)], [new Date(last.timestamp)]];
            let isY2: boolean = false;
            let mainGraphLabels: Array<string> = [];


            if (entities.length == 1) {
                mainGraphLabels = [];
                choosedCollection.series.forEach((series, _index) => {
                    mainGraphLabels.push(series.label);
                    initialData.forEach(_data => {
                        _data[_index + 1] = null;
                    });
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
            let currentDatewindowOnMouseDown = [];

            const datewindowChangeFunc = (e, yAxisRange?: Array<Array<number>>) => {
                let datewindow = [];

                if (this.ragnebarGraph) {
                    datewindow = this.ragnebarGraph.xAxisRange();
                } else {
                    datewindow = this.mainGraph.xAxisRange();
                }
                // check

                if (datewindow[0] instanceof Date) {
                    datewindow[0] = datewindow[0].getTime();
                }

                if (datewindow[1] instanceof Date) {
                    datewindow[1] = datewindow[1].getTime();
                }

                if (datewindow[0] == currentDatewindowOnMouseDown[0] && datewindow[1] == currentDatewindowOnMouseDown[1]) {
                    // console.debug("no change!");
                } else {
                    // fetch data again 
                    // sorting
                    this.currentView.graphConfig.collections.sort((a, b) => {
                        return a.interval > b.interval ? 1 : -1;
                    });

                    choosedCollection = this.currentView.graphConfig.collections.find((collection) => {
                        return collection.threshold && (datewindow[1] - datewindow[0]) <= (collection.threshold.max);
                    });
                    let collection: GraphCollection = { label: "", name: "", series: [], interval: 0, initScales: { left: { min: 0, max: 0 }, right: { min: 0, max: 0 } } };
                    Object.assign(collection, choosedCollection);

                    if (yAxisRange) {
                        yAxisRange.forEach((element, _index) => {
                            if (_index == 0) {
                                //left
                                if (!collection.initScales.left) {
                                    collection.initScales.left = { min: 0, max: 0 };
                                }
                                collection.initScales.left.min = element[0];
                                collection.initScales.left.max = element[1];
                            } else if (_index == 1) {
                                if (!collection.initScales.right) {
                                    collection.initScales.right = { min: 0, max: 0 };
                                }
                                collection.initScales.right.min = element[0];
                                collection.initScales.right.max = element[1];
                            }
                        });
                    }
                    this.currentCollection = collection;
                    this.rangeCollection = this.currentView.graphConfig.rangeCollection;

                    this.start = datewindow[0];
                    this.end = datewindow[1];

                    this.update();
                    this.updateCollectionLabels(this.header, this.currentView.graphConfig.entities, choosedCollection, this.currentView.graphConfig.collections);
                }
            }

            let callbackFuncForInteractions = (e, yAxisRange, refreshData) => {

                if (refreshData) {
                    datewindowChangeFunc(e, yAxisRange);
                } else {
                    // set initsacle
                    if (yAxisRange) {
                        yAxisRange.forEach((element, _index) => {
                            if (_index == 0) {
                                //left
                                if (!this.currentCollection.initScales.left) {
                                    this.currentCollection.initScales.left = { min: 0, max: 0 };
                                }
                                this.currentCollection.initScales.left.min = element[0];
                                this.currentCollection.initScales.left.max = element[1];
                            } else if (_index == 1) {
                                if (!this.currentCollection.initScales.right) {
                                    this.currentCollection.initScales.right = { min: 0, max: 0 };
                                }
                                this.currentCollection.initScales.right.min = element[0];
                                this.currentCollection.initScales.right.max = element[1];
                            }
                        });
                    }

                }


                if (interactionCallback) {
                    // ready to update children
                    interactionCallback();
                }
            };


            let dateLabelLeftAttrs: Array<DomAttrs> = [{ key: 'class', value: 'fgp-graph-range-bar-date-label-left' }];
            let startLabelLeft: HTMLElement = DomElementOperator.createElement('label', dateLabelLeftAttrs);
            let dateLabelRightAttrs: Array<DomAttrs> = [{ key: 'class', value: 'fgp-graph-range-bar-date-label-right' }];
            let endLabelRight: HTMLElement = DomElementOperator.createElement('label', dateLabelRightAttrs);

            // create a interaction model instance
            let interactionModel: GraphInteractions = new GraphInteractions(callbackFuncForInteractions, [first.timestamp, last.timestamp]);
            let currentSelection = "";
            this.mainGraph = new Dygraph(this.graphBody, initialData, {
                labels: ['x'].concat(mainGraphLabels),
                ylabel: choosedCollection.yLabel,
                y2label: choosedCollection.y2Label,
                rangeSelectorHeight: 30,
                legend: "follow",
                legendFormatter: this.currentView.graphConfig.features.legend ? this.currentView.graphConfig.features.legend : formatters.legendForSingleSeries,
                labelsKMB: true,
                axes: {
                    x: {
                        axisLabelFormatter: formatters.axisLabel
                    },
                    y: yScale,
                    y2: y2Scale
                },
                highlightSeriesOpts: { strokeWidth: 1 },
                highlightCallback: (e, x, ps, row, seriesName) => {
                    if (this.currentView.interaction && this.currentView.interaction.callback && this.currentView.interaction.callback.highlighCallback) {
                        this.currentView.interaction.callback.highlighCallback(x, seriesName, ps);
                    }
                    currentSelection = seriesName;
                },
                clickCallback: (e, x, points) => {
                    if (this.currentView.interaction && this.currentView.interaction.callback && this.currentView.interaction.callback.selectCallback) {
                        this.currentView.interaction.callback.selectCallback(currentSelection);
                    }
                },
                interactionModel: {
                    'mousedown': interactionModel.mouseDown,
                    'mouseup': interactionModel.mouseUp,
                    'mousemove': interactionModel.mouseMove,
                    'mousewheel': interactionModel.mouseScroll,
                    'DOMMouseScroll': interactionModel.mouseScroll,
                    'wheel': interactionModel.mouseScroll,
                    'mouseenter': interactionModel.mouseEnter,
                },
                drawCallback: (dygraph, is_initial) => {
                    const xAxisRange: Array<number> = dygraph.xAxisRange();
                    if (this.currentView.graphConfig.features.rangeBar && this.currentView.graphConfig.rangeCollection) {
                        startLabelLeft.innerHTML = moment.tz(xAxisRange[0], this.currentView.timezone ? this.currentView.timezone : moment.tz.guess()).format('lll z');
                        endLabelRight.innerHTML = moment.tz(xAxisRange[1], this.currentView.timezone ? this.currentView.timezone : moment.tz.guess()).format('lll z');
                    }
                    // update datewindow
                    this.datewindowCallback(xAxisRange);
                }
            });

            // remove first
            if (this.graphContainer.getElementsByClassName("fgp-graph-bottom").length > 0) {
                let bottoms = this.graphContainer.getElementsByClassName("fgp-graph-bottom");
                for (var i = 0; i < bottoms.length; i++) {
                    this.graphContainer.removeChild(bottoms[i]);
                }
            }
            // range-bar?
            if (this.currentView.graphConfig.features.rangeBar && this.currentView.graphConfig.rangeCollection) {
                let labels: Array<string> = [];
                let firstData = [new Date(first.timestamp)];
                let lastData = [new Date(last.timestamp)];
                let rangeSeries = null;
                this.rangeCollection = this.currentView.graphConfig.rangeCollection;
                // range device always one
                rangeSeries = {};
                // check if ther is a y2
                this.currentView.graphConfig.rangeCollection.series.forEach((series, _index) => {
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

                // create 2 labels for start and end

                let dateLabels: HTMLElement = DomElementOperator.createElement('div', [{ key: 'style', value: 'height:22px;' }]);
                dateLabels.appendChild(startLabelLeft);
                dateLabels.appendChild(endLabelRight);
                bottom = DomElementOperator.createElement('div', bottomAttrs);
                bottom.appendChild(dateLabels);
                let rangeBarAttrs: Array<DomAttrs> = [{ key: 'class', value: 'fgp-graph-rangebar' }];
                let rangeBar: HTMLElement = DomElementOperator.createElement('div', rangeBarAttrs);
                bottom.appendChild(rangeBar);
                this.graphContainer.appendChild(bottom);
                //create range-bar graph
                this.ragnebarGraph = new Dygraph(rangeBar, [
                    firstData,   // first
                    lastData    // last
                ], {
                        xAxisHeight: 0,
                        axes: {
                            x: { drawAxis: false },
                            y: {
                                axisLabelWidth: 60
                            },
                            y2: {
                                axisLabelWidth: 60
                            }
                        },
                        labels: ['x'].concat(labels),
                        // series: rangeSeries,
                        showRangeSelector: true,
                        rangeSelectorHeight: 30,
                        legend: 'never',
                        drawCallback: (dygraph, is_initial) => {
                            const xAxisRange: Array<number> = dygraph.xAxisRange();
                            startLabelLeft.innerHTML = moment.tz(xAxisRange[0], this.currentView.timezone ? this.currentView.timezone : moment.tz.guess()).format('lll z');
                            endLabelRight.innerHTML = moment.tz(xAxisRange[1], this.currentView.timezone ? this.currentView.timezone : moment.tz.guess()).format('lll z');
                            this.datewindowCallback(xAxisRange);
                        }
                    });

                // check 
                let sync = new Synchronizer([this.ragnebarGraph, this.mainGraph]);
                sync.synchronize();
                readyCallback(this.mainGraph);
                let rangeBarCanvas = (rangeBar.getElementsByClassName("dygraph-rangesel-fgcanvas")[0]);
                let rangeBarHandles = rangeBar.getElementsByClassName("dygraph-rangesel-zoomhandle");
                const rangebarMousedownFunc = (e) => {
                    // check
                    const datewindow = this.ragnebarGraph.xAxisRange();
                    if (datewindow[0] instanceof Date) {
                        datewindow[0] = datewindow[0].getTime();
                    }

                    if (datewindow[1] instanceof Date) {
                        datewindow[1] = datewindow[1].getTime();
                    }
                    currentDatewindowOnMouseDown = datewindow;


                    window.addEventListener("mouseup", (e) => {
                        datewindowChangeFunc(e, null);

                        if (interactionCallback) {
                            // ready to update children
                            interactionCallback();
                        }
                    }, { once: true });
                }


                for (let i = 0; i < rangeBarHandles.length; i++) {
                    const element = rangeBarHandles[i];
                    let style = element.getAttribute("style");
                    style.replace("z-index: 10;", "z-index: " + (10 + i) + ";");
                    element.setAttribute("style", style);
                    element.addEventListener('mousedown', rangebarMousedownFunc);
                }

                // add mouse listener 
                rangeBarCanvas.addEventListener('mousedown', rangebarMousedownFunc);
            } else {
                readyCallback(this.mainGraph);
            }
            // update datewindow
            this.mainGraph.updateOptions({
                dateWindow: [new Date(timewindowStart), new Date(timewindowEnd)]
            });

            this.start = timewindowStart;
            this.end = timewindowEnd;


            this.update(first.timestamp, last.timestamp);
            this.updateCollectionLabels(this.header, this.currentView.graphConfig.entities, choosedCollection, this.currentView.graphConfig.collections);
            const seriesName = [];
            if (this.currentView.graphConfig.entities.length > 1) {
                this.currentView.graphConfig.entities.forEach(entity => {
                    seriesName.push(entity.name);
                });
            } else {
                // single device with multiple lines
                choosedCollection.series.forEach(series => {
                    seriesName.push(series.label);
                });
            }

            this.updateSeriesDropdown(this.header, seriesName, this.mainGraph);

        });
    }


    refresh = () => {
        const xAxisRange: Array<number> = this.mainGraph.xAxisRange();

        let datewindow = [];

        if (xAxisRange) {
            datewindow[0] = xAxisRange[0];
            datewindow[1] = xAxisRange[1];
        }

        // get correct collection then call update
        if (datewindow[0] == this.start && datewindow[1] == this.end) {
            // console.debug("no change!");
        } else {
            this.start = datewindow[0];
            this.end = datewindow[1];

            this.currentView.graphConfig.collections.sort((a, b) => {
                return a.interval > b.interval ? 1 : -1;
            });

            this.currentCollection = this.currentView.graphConfig.collections.find((collection) => {
                return collection.threshold && (datewindow[1] - datewindow[0]) <= (collection.threshold.max);
            });
            let collection: GraphCollection = { label: "", name: "", series: [], interval: 0, initScales: { left: { min: 0, max: 0 }, right: { min: 0, max: 0 } } };
            Object.assign(collection, this.currentCollection);
            // check initScale



            this.update();
            this.updateCollectionLabels(this.header, this.currentView.graphConfig.entities, this.currentCollection, this.currentView.graphConfig.collections);
        }


    }


    update = (first?: number, last?: number) => {
        let mainGraph = this.mainGraph;
        let rangebarGraph = this.ragnebarGraph;
        let graphCollection = this.currentCollection;
        let rangeCollection = this.rangeCollection;
        let start = this.start;
        let end = this.end;

        let view = this.currentView;

        let formatters: Formatters = new Formatters(view.timezone ? view.timezone : moment.tz.guess());
        let mainGraphColors: Array<string> = [];
        // get data for main graph
        // main graph entities
        const mainEntities: Array<string> = [];
        view.graphConfig.entities.forEach(entity => {
            mainEntities.push(entity.id);
        });

        // get fields for main graph
        let fieldsForMainGraph = [];
        let yAxis = { min: null, max: null };
        let yAxis2 = { min: null, max: null };
        let yIndexs: Array<number> = [];
        let y2Indexs: Array<number> = [];
        let colors: Array<string> = [];
        let mainGraphSeries = {};
        let isY2: boolean = false;
        graphCollection.series.forEach((series, _index) => {
            let _tempFields = (series.exp).match(GraphOperator.FIELD_PATTERN);
            // replace all "data."" with ""
            _tempFields = _tempFields.map(exp => exp.replace("data.", ""));
            // put fields together
            fieldsForMainGraph = fieldsForMainGraph.concat(_tempFields);

            if (view.graphConfig.entities.length == 1 && series.color) {
                colors.push(series.color);
            }

            if (series.yIndex && series.yIndex == 'right') {
                // right
                y2Indexs.push(_index + 1);
            } else if (!series.yIndex || series.yIndex == 'left') {
                // left
                yIndexs.push(_index + 1);
            }

            mainGraphSeries[series.label] = {
                axis: series.yIndex == 'left' ? 'y' : 'y2',
                color: series.color,
                highlightCircleSize: 4
            };

            if (series.type == 'dots') {
                mainGraphSeries[series.label]["strokeWidth"] = 0;
                mainGraphSeries[series.label]["drawPoints"] = true;
            }

            if (series.yIndex != 'left') {
                isY2 = true;
            }

        });


        let prepareGraphData = (data, entities, collection): { data: Array<any>, axis?: { y: { min: number, max: number }, y2?: { min: number, max: number } } } => {
            // update main graph
            let graphData = [];
            let finalData = [];
            let _dates: Array<number> = [];
            if (first && last) {
                _dates = [first, last];
            }
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
            // 
            _dates.sort();
            if (entities.length == 1) {
                // get collection config
                collection.series.forEach((series, _index) => {
                    var f = new Function("data", "with(data) { if(" + series.exp + "!=null)return " + series.exp + ";return null;}");
                    // generate data for this column
                    _dates.forEach(date => {
                        // find date in finalData
                        let point = finalData.find(record => record[0].getTime() == date);
                        let record = graphData[0].find(data => data.timestamp == date);

                        if (point) {
                            point[_index + 1] = record ? f(record) : null;
                        } else {
                            point = [new Date(date)];
                            point[_index + 1] = record ? f(record) : null;
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
                    let point = finalData.find(record => record[0].getTime() == date);
                    // if not found just add it as new one.
                    if (!point) {
                        point = [new Date(date)];
                        finalData.push(point);
                    }

                    entities.forEach((entity, _index) => {
                        let record = graphData[_index].find(data => data.timestamp == date);
                        point[_index + 1] = record ? f(record) : null;

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
            let yScale: { valueRange: Array<number> } = { valueRange: [] };
            let y2Scale: { valueRange: Array<number> } = { valueRange: [] };
            // get init scale
            if (!graphCollection.initScales) {
                if (graphData.axis) {
                    if (graphData.axis.y) {
                        yScale.valueRange = [graphData.axis.y.min * 0.97, graphData.axis.y.max * 1.03];
                    }

                    if (graphData.axis.y2) {
                        y2Scale.valueRange = [graphData.axis.y2.min * 0.97, graphData.axis.y2.max * 1.03];
                    }
                }
            } else {
                // check if there is a init scale
                if (graphCollection.initScales.left) {
                    yScale.valueRange = [graphCollection.initScales.left.min, graphCollection.initScales.left.max];

                }
                if (graphCollection.initScales.right) {
                    y2Scale.valueRange = [graphCollection.initScales.right.min, graphCollection.initScales.right.max]
                }
            }
            // clear old graph
            mainGraph.hidden_ctx_.clearRect(0, 0, mainGraph.hidden_.width, mainGraph.hidden_.height);
            // update main graph
            mainGraph.updateOptions({
                file: graphData.data,
                series: mainGraphSeries,
                fillGraph: graphCollection.fill ? graphCollection.fill : false,
                highlightSeriesOpts: {
                    strokeWidth: 1.5
                },
                axes: {
                    x: {
                        axisLabelFormatter: formatters.axisLabel
                    },
                    y: {
                        valueRange: yScale.valueRange,
                        axisLabelWidth: 60,
                        labelsKMB: true
                    },
                    y2: {
                        valueRange: y2Scale.valueRange,
                        axisLabelWidth: 60,
                        labelsKMB: true
                    }
                }
            });

        });


        if (view.graphConfig.features.rangeBar) {
            // get fields for range-bar 
            const rangeEntities: Array<string> = [view.graphConfig.rangeEntity.id];
            // get fields for main graph
            let fieldsForRangebarGraph = [];

            rangeCollection.series.forEach(series => {
                let _tempFields = (series.exp).match(GraphOperator.FIELD_PATTERN);
                // replace all "data."" with ""
                _tempFields = _tempFields.map(exp => exp.replace("data.", ""));
                // put fields together
                fieldsForRangebarGraph = fieldsForRangebarGraph.concat(_tempFields);
            });

            // for range
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

                let rangeSeries = {};
                let labels = [];
                // check if ther is a y2
                rangeCollection.series.forEach((series, _index) => {
                    labels.push(series.label);
                    rangeSeries[series.label] = {
                        axis: (series.yIndex == "left" || !series.yIndex) ? 'y' : 'y2'
                    };
                });

                if (isY2) {
                    labels.push("y2");
                    rangeSeries["y2"] = {
                        axis: "y2"
                    };

                    preData.forEach(_data => {
                        if (_data.length == 2) {
                            _data.push(null);
                        }
                    });
                } else {
                    preData.forEach(_data => {
                        if (_data.length > 2) {
                            _data.splice(2, _data.length - 2);
                        }
                    });
                }
                rangebarGraph.updateOptions({
                    file: preData,
                    series: rangeSeries,
                    labels: ['x'].concat(labels)
                });
            });
        }

    }

}
