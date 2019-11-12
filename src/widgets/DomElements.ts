import Dygraph from 'dygraphs';
import { ViewConfig, GraphCollection, DomAttrs, GraphSeries, Entity, GraphExports } from '../metadata/configurations';
import moment from 'moment-timezone';
import { Synchronizer } from '../extras/synchronizer';
import { DataHandler, ExportUtils, LoadingSpinner } from '../services/dataService';
import { GraphInteractions } from '../extras/interactions';
import { Formatters } from '../extras/formatters';

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
        let errorHappened = false;
        // put attributes on element
        attrs.forEach(attr => {
            // check the attribute, if exist then throw exception
            if (!dom.getAttribute(attr.key)) {
                dom.setAttribute(attr.key, attr.value);
            } else {
                throw new Error("Duplicate Attrs " + attr.key);
            }

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

    private currentView!: ViewConfig;

    private currentCollection!: GraphCollection | undefined;

    private rangeCollection!: GraphCollection;

    private start!: number;

    private end!: number;

    public datewindowCallback: any;

    private currentGraphData: { id: string, data: any[] }[];

    private graphContainer: HTMLElement;

    private graphBody: HTMLElement;

    private intervalsDropdown: HTMLElement;

    private header: HTMLElement;

    private spinner: LoadingSpinner;

    private yAxisRanges = [];

    constructor(mainGraph: Dygraph, rangeGraph: Dygraph, graphContainer: HTMLElement, graphBody: HTMLElement, intervalsDropdown: HTMLElement, header: HTMLElement, datewindowCallback: any) {
        this.mainGraph = mainGraph;
        this.ragnebarGraph = rangeGraph;
        this.graphContainer = graphContainer;
        this.datewindowCallback = datewindowCallback;
        this.graphBody = graphBody;
        this.intervalsDropdown = intervalsDropdown;
        this.header = header;
        this.currentGraphData = [];
        this.spinner = new LoadingSpinner(this.graphContainer);
    }

    public showSpinner = () => {
        if (this.spinner) {
            this.spinner.show();
        }
    }


    public highlightSeries = (series: string[], duration: number) => {

        if (series) {
            // hide all the others 
            let visibility: boolean[] = this.mainGraph.getOption("visibility");
            let _updateVisibility: boolean[] = [];
            if (this.currentCollection) {
                const _graphSeries = this.currentCollection.series;
                // get indexes
                let _indexsShow: number[] = [];
                _graphSeries.forEach((_series, _index) => {
                    //
                    series.forEach((_showSeries, _showIndex) => {
                        if (_showSeries === _series.label) {
                            _indexsShow.push(_index);
                        }
                    });
                });
                // set visibility
                visibility.forEach((_v, _i) => {
                    if (_indexsShow.indexOf(_i) == -1) {
                        _v = false;
                    }
                    let exist: boolean = false;
                    _indexsShow.forEach(_ei => {
                        if (_ei === _i) {
                            // found it
                            exist = true;
                        }
                    });
                    if (!exist) {
                        _updateVisibility.push(false);
                    } else {
                        _updateVisibility.push(true);
                    }
                });
                this.mainGraph.updateOptions({
                    visibility: _updateVisibility
                });
                if (duration > 0) {
                    // take all visibility back
                    setTimeout(() => {
                        _updateVisibility = [];
                        visibility.forEach(_v => {
                            _updateVisibility.push(true);
                        });
                        this.mainGraph.updateOptions({
                            visibility: _updateVisibility
                        });
                    }, duration * 1000);
                }
            }
        }
    }

    /**
     * update labels
     *
     * @private
     * @memberof GraphOperator
     */
    private updateCollectionLabels = (header: HTMLElement, entities: Array<Entity>, choosedCollection: GraphCollection | undefined, collections: Array<GraphCollection>) => {
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
            if (choosedCollection && _collection.name == choosedCollection.name) {
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

        new DropdownMenu(select, opts, (series: string, checked: boolean) => {
            let visibility: Array<boolean> = graph.getOption('visibility');
            let labels: Array<string> = graph.getLabels();

            labels.forEach((label: string, index: number) => {
                if (label == series) {
                    visibility[index - 1] = checked;
                }
            });
            graph.updateOptions({
                visibility: visibility
            });

        }).render();
    }

    private updateExportButtons = (view: ViewConfig) => {
        if (view.graphConfig.features && view.graphConfig.features.exports) {
            // find button area
            let buttons = this.header.getElementsByClassName("fgp-buttons");
            if (buttons && buttons[0]) {
                buttons[0].innerHTML = "";
            }
            // check each of them
            view.graphConfig.features.exports.forEach(_export => {
                if (_export === GraphExports.Data) {
                    // create button and add it into header
                    let btnAttrs: Array<DomAttrs> = [{ key: "class", value: "fgp-export-button fgp-btn-export-data" }];
                    let btnData = DomElementOperator.createElement('button', btnAttrs);
                    btnData.addEventListener("click", (event) => {
                        // export data
                        // check data (1 or more)
                        if (this.currentGraphData && this.currentGraphData.length > 0 && this.currentCollection) {
                            let csvStr: string = "";
                            // single device
                            const currentData = this.currentGraphData;
                            const currentCollection = this.currentCollection;
                            // prepare the file name
                            const _fileName = currentCollection.label + "_" + moment().toISOString() + ".csv";
                            let _columns: string[] = ["timestamp"];
                            const graph: Dygraph = this.mainGraph;
                            const _series = graph.getLabels();
                            _series.forEach((_s, _index) => {
                                if (_index > 0) {
                                    _columns.push(_s);
                                }
                            });
                            // add titles first
                            _columns.forEach((title, _index) => {
                                if (_index < _columns.length - 1) {
                                    csvStr += title + ',';
                                } else {
                                    csvStr += title + '\n';
                                }
                            });
                            // prepare data
                            if (currentData) {
                                currentData.forEach((_d: any) => {
                                    _columns.forEach((title, _index) => {
                                        if (_index < _columns.length - 1) {
                                            csvStr += _d[_index] + ',';
                                        } else {
                                            csvStr += _d[_index] + '\n';
                                        }
                                    });
                                });
                            }
                            ExportUtils.exportCsv(csvStr, _fileName);
                        }
                    });
                    buttons[0].appendChild(btnData);
                } else if (_export === GraphExports.Image) {
                    let btnAttrs: Array<DomAttrs> = [{ key: "class", value: "fgp-export-button fgp-btn-export-image" }];
                    let btnImage = DomElementOperator.createElement('button', btnAttrs);
                    btnImage.addEventListener("click", (event) => {
                        const graphContainer = this.graphContainer;
                        if (graphContainer) {
                            const mainGraphContainer = graphContainer.getElementsByClassName("fgp-graph-body");
                            if (mainGraphContainer[0] && this.currentCollection) {
                                // first one
                                ExportUtils.saveAsImage(mainGraphContainer[0] as HTMLElement, this.currentCollection.label + "_" + moment().toISOString() + '.png');
                            }
                        }
                    });
                    buttons[0].appendChild(btnImage);
                }
            });
        }


    }


    init = (view: ViewConfig, readyCallback?: any, interactionCallback?: any) => {
        this.currentView = view;
        this.updateExportButtons(view);
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

        const ranges: Array<{ name: string, value: number, show?: boolean }> | undefined = this.currentView.ranges;
        if (ranges && ranges.length > 0) {
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

        // set init range
        if (view.initRange) {
            timewindowEnd = moment(view.initRange.end).tz(this.currentView.timezone ? this.currentView.timezone : moment.tz.guess()).valueOf();
            timewindowStart = moment(view.initRange.start).tz(this.currentView.timezone ? this.currentView.timezone : moment.tz.guess()).valueOf();
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

        let choosedCollection: GraphCollection | undefined;

        const intervalsDropdonwOptions = new DropdownButton(<HTMLSelectElement>this.intervalsDropdown, [...dropdownOpts]);
        intervalsDropdonwOptions.render();

        this.intervalsDropdown.onchange = (e) => {
            const intervalDropdown: HTMLSelectElement = <HTMLSelectElement>e.currentTarget;
            graphRangesConfig.forEach(config => {
                if (config.name == intervalDropdown.value) {
                    // if ragnebar graph not exist, ignore it.
                    if (this.ragnebarGraph) {
                        this.ragnebarGraph.updateOptions({
                            dateWindow: [(timewindowEnd - config.value), timewindowEnd]
                        });
                    }

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
        let fieldsForCollection: any[] = [];
        // get range config and find the first and last
        this.currentView.graphConfig.rangeCollection.series.forEach(series => {
            let _tempFields: string[] | null = (series.exp).match(GraphOperator.FIELD_PATTERN);
            // replace all "data."" with ""
            if (_tempFields) {
                _tempFields = _tempFields.map(exp => exp.replace("data.", ""));
            }
            // put fields together
            fieldsForCollection = fieldsForCollection.concat(_tempFields);
        });


        // 
        this.currentView.dataService.fetchFirstNLast([this.currentView.graphConfig.rangeEntity.name], this.currentView.graphConfig.rangeEntity.type, this.currentView.graphConfig.rangeCollection.name, Array.from(new Set(fieldsForCollection))).then(resp => {
            // get first and last records, just need start and end timestamp
            let first: any = { timestamp: moment.tz(this.currentView.timezone ? this.currentView.timezone : moment.tz.guess()).valueOf() };
            let last: any = { timestamp: 0 };
            // get all first and last then find out which first is the smalllest and last is the largest
            // entities.forEach(entity => {
            //
            resp.forEach(entityData => {
                if (entityData.id == this.currentView.graphConfig.rangeEntity.name) {
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
            // });

            // init empty graph with start and end  no other data
            let firstRanges: any = graphRangesConfig.find(range => range.show && range.show == true);
            if (!firstRanges) {
                // throw errors;
                throw new Error("non default range for range-bar!");
            }

            // get fields and labels
            this.currentView.graphConfig.collections.forEach(collection => {
                // if there is a config for what level need to show.
                if (collection.threshold && firstRanges.value) {
                    //  >= && <    [ in the middle  )
                    if (firstRanges.value > collection.threshold.min && firstRanges.value <= collection.threshold.max) {
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

            let initialData = [[first.timestamp], [last.timestamp]];


            if (this.currentView.initRange) {
                if (this.currentView.initRange.start < first.timestamp) {
                    initialData[0] = [this.currentView.initRange.start];
                }

                if (this.currentView.initRange.end > last.timestamp) {
                    initialData[1] = [this.currentView.initRange.end];
                }
                // upate choosed collection
                const gap = initialData[1][0] - initialData[0][0];

                choosedCollection = this.currentView.graphConfig.collections.find((collection) => {
                    return collection.threshold && (gap) <= (collection.threshold.max - collection.threshold.min);
                });

            }

            let isY2: boolean = false;
            let mainGraphLabels: Array<string> = [];

            if (choosedCollection && entities.length == 1) {
                mainGraphLabels = [];
                choosedCollection.series.forEach((series, _index) => {
                    mainGraphLabels.push(series.label);
                    initialData.forEach((_data: any) => {
                        _data[_index + 1] = null;
                    });
                    if (series.yIndex == "right") {
                        isY2 = true;
                    }
                });

            } else if (choosedCollection && entities.length > 1 && choosedCollection.series && choosedCollection.series[0]) {
                mainGraphLabels = [];
                entities.forEach((entity, _index) => {
                    mainGraphLabels.push(entity);
                    initialData.forEach((_data: any) => {
                        _data[_index + 1] = null;
                    });
                });
            }

            let yScale: any = {};
            let y2Scale: any = {};
            // check if there is a init scale
            if (choosedCollection && choosedCollection.initScales) {
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

            if (choosedCollection) {
                // set currentCollection to choosedCollection
                this.currentCollection = choosedCollection;
            }



            let currentDatewindowOnMouseDown: any[] = [];

            const datewindowChangeFunc = (e: MouseEvent, yAxisRange?: Array<Array<number>>) => {
                let datewindow: number[] = [];

                if (this.ragnebarGraph) {
                    datewindow = this.ragnebarGraph.xAxisRange();
                } else {
                    datewindow = this.mainGraph.xAxisRange();
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
                                if (collection && collection.initScales && !collection.initScales.left) {
                                    collection.initScales.left = { min: 0, max: 0 };
                                } else if (collection && collection.initScales && collection.initScales.left) {
                                    collection.initScales.left.min = element[0];
                                    collection.initScales.left.max = element[1];
                                }
                            } else if (_index == 1) {
                                if (collection && collection.initScales && !collection.initScales.right) {
                                    collection.initScales.right = { min: 0, max: 0 };
                                } else if (collection && collection.initScales && collection.initScales.right) {
                                    collection.initScales.right.min = element[0];
                                    collection.initScales.right.max = element[1];
                                }
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

            let callbackFuncForInteractions = (e: MouseEvent, yAxisRange: Array<Array<number>>, refreshData: any) => {
                if (refreshData) {
                    datewindowChangeFunc(e, yAxisRange);
                } else {
                    // set initsacle
                    if (yAxisRange) {
                        yAxisRange.forEach((element, _index) => {
                            if (_index == 0) {
                                //left
                                if (this.currentCollection && this.currentCollection.initScales && !this.currentCollection.initScales.left) {
                                    this.currentCollection.initScales.left = { min: 0, max: 0 };
                                } else if (this.currentCollection && this.currentCollection.initScales && this.currentCollection.initScales.left) {
                                    this.currentCollection.initScales.left.min = element[0];
                                    this.currentCollection.initScales.left.max = element[1];
                                }

                            } else if (_index == 1) {
                                if (this.currentCollection && this.currentCollection.initScales && !this.currentCollection.initScales.right) {
                                    this.currentCollection.initScales.right = { min: 0, max: 0 };
                                } else if (this.currentCollection && this.currentCollection.initScales && this.currentCollection.initScales.right) {
                                    this.currentCollection.initScales.right.min = element[0];
                                    this.currentCollection.initScales.right.max = element[1];
                                }
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
                ylabel: choosedCollection && choosedCollection.yLabel ? choosedCollection.yLabel : "",
                y2label: choosedCollection && choosedCollection.y2Label ? choosedCollection.y2Label : "",
                rangeSelectorHeight: 30,
                legend: "follow",
                legendFormatter: this.currentView.graphConfig.features.legend ? this.currentView.graphConfig.features.legend : formatters.legendForSingleSeries,
                labelsKMB: true,
                // drawAxesAtZero: true,
                connectSeparatedPoints: this.currentView.connectSeparatedPoints ? this.currentView.connectSeparatedPoints : false,
                axes: {
                    x: {
                        axisLabelFormatter: formatters.axisLabel,
                        ticker: formatters.DateTickerTZ
                    },
                    y: yScale,
                    y2: y2Scale
                },
                highlightSeriesBackgroundAlpha: this.currentView.highlightSeriesBackgroundAlpha ? this.currentView.highlightSeriesBackgroundAlpha : 0.5,
                highlightSeriesOpts: { strokeWidth: 1 },
                highlightCallback: (e, x, ps, row, seriesName) => {
                    if (this.currentView.interaction && this.currentView.interaction.callback && this.currentView.interaction.callback.highlighCallback) {
                        this.currentView.interaction.callback.highlighCallback(x, seriesName, ps);
                    }
                    currentSelection = seriesName;
                },
                clickCallback: (e, x, points) => {
                    if (this.currentView.interaction && this.currentView.interaction.callback && this.currentView.interaction.callback.clickCallback) {
                        this.currentView.interaction.callback.clickCallback(currentSelection);
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
                    if (this.spinner && this.spinner.isLoading) {
                        // remove spinner from container
                        this.spinner.done();
                    }
                    // update datewindow
                    this.datewindowCallback(xAxisRange, this.currentView);
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
                let firstData: any[] = [first.timestamp];
                let lastData: any[] = [last.timestamp];

                if (this.currentView.initRange) {
                    if (this.currentView.initRange.start < first.timestamp) {
                        firstData = [this.currentView.initRange.start];
                    }

                    if (this.currentView.initRange.end > last.timestamp) {
                        lastData = [this.currentView.initRange.end];
                    }
                }

                let rangeSeries: any = null;
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
                    drawCallback: (dygraph, isInitial) => {
                        const xAxisRange: Array<number> = dygraph.xAxisRange();
                        startLabelLeft.innerHTML = moment.tz(xAxisRange[0], this.currentView.timezone ? this.currentView.timezone : moment.tz.guess()).format('lll z');
                        endLabelRight.innerHTML = moment.tz(xAxisRange[1], this.currentView.timezone ? this.currentView.timezone : moment.tz.guess()).format('lll z');
                        // only run first draw
                        if (isInitial) {
                            // find zoomhandle
                            const handles = this.graphContainer.getElementsByClassName("dygraph-rangesel-zoomhandle");
                            // left handle  just in case the right handle overlap the left one
                            if (handles[0] instanceof HTMLElement) {
                                handles[0].style.zIndex = "11";
                            }
                        }

                        this.datewindowCallback(xAxisRange, this.currentView);
                    }
                });

                // check 
                let sync = new Synchronizer([this.ragnebarGraph, this.mainGraph]);
                sync.synchronize();
                // readyCallback(this.mainGraph);
                let rangeBarCanvas: any = (rangeBar.getElementsByClassName("dygraph-rangesel-fgcanvas")[0]);
                let rangeBarHandles: any = rangeBar.getElementsByClassName("dygraph-rangesel-zoomhandle");
                const rangebarMousedownFunc = (e: MouseEvent) => {
                    // check
                    const datewindow = this.ragnebarGraph.xAxisRange();
                    currentDatewindowOnMouseDown = datewindow;

                    window.addEventListener("mouseup", (e) => {
                        datewindowChangeFunc(e, []);
                        // check if need to call "callback function"
                        if (interactionCallback) {
                            // ready to update children
                            interactionCallback();
                        }
                    }, { once: true });
                }

                for (let i = 0; i < rangeBarHandles.length; i++) {
                    const element: any = rangeBarHandles[i];
                    let style: any = element.getAttribute("style");
                    style.replace("z-index: 10;", "z-index: " + (10 + i) + ";");
                    element.setAttribute("style", style);
                    element.addEventListener('mousedown', rangebarMousedownFunc);
                }
                // add mouse listener 
                rangeBarCanvas.addEventListener('mousedown', rangebarMousedownFunc);
            } else {

            }
            // update datewindow
            this.mainGraph.updateOptions({
                dateWindow: [timewindowStart, timewindowEnd]
            });

            this.start = timewindowStart;
            this.end = timewindowEnd;

            this.update(first.timestamp, last.timestamp);
            // send "ready" after update 
            readyCallback(this.mainGraph);
            this.updateCollectionLabels(this.header, this.currentView.graphConfig.entities, choosedCollection, this.currentView.graphConfig.collections);
            const seriesName: string[] = [];
            if (this.currentView.graphConfig.entities.length > 1) {
                this.currentView.graphConfig.entities.forEach(entity => {
                    seriesName.push(entity.name);
                });
            } else {
                // single device with multiple lines
                if (choosedCollection) {
                    choosedCollection.series.forEach(series => {
                        seriesName.push(series.label);
                    });
                }

            }

            this.updateSeriesDropdown(this.header, seriesName, this.mainGraph);

        });
    }


    refresh = () => {
        const xAxisRange: Array<number> = this.mainGraph.xAxisRange();

        let datewindow: number[] = [];

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

        let mainGraph: any = this.mainGraph;
        let rangebarGraph: any = this.ragnebarGraph;
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
        let mainDeviceType: string = "";
        view.graphConfig.entities.forEach(entity => {
            mainEntities.push(entity.id);
            mainDeviceType = entity.type;
        });

        // get fields for main graph
        let fieldsForMainGraph: string[] = [];
        let yAxis: any = { min: null, max: null };
        let yAxis2: any = { min: null, max: null };
        let yIndexs: Array<number> = [];
        let y2Indexs: Array<number> = [];
        let colors: Array<string> = [];
        let mainGraphSeries: any = {};
        let mainLabels: Array<string> = [];
        let isY2: boolean = false;
        if (graphCollection) {
            graphCollection.series.forEach((series, _index) => {
                let _tempFields: string[] | null = (series.exp).match(GraphOperator.FIELD_PATTERN);
                // replace all "data."" with ""
                if (_tempFields) {
                    _tempFields = _tempFields.map(exp => exp.replace("data.", ""));
                    fieldsForMainGraph = fieldsForMainGraph.concat(_tempFields);
                }
                // put fields together
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
        }



        let prepareGraphData = (data: any[], entities: any[], collection: any): { data: Array<any>, axis?: { y: { min: number, max: number }, y2?: { min: number, max: number } } } => {
            // update main graph
            let graphData: any[] = [];
            let finalData: any[] = [];
            let _dates: Array<number> = [];
            if (first && last) {
                _dates = [first, last];
            }
            data.forEach(entityData => {
                entities.forEach(id => {
                    if (id == entityData.id) {
                        graphData.push(entityData.data);
                        // merge date 
                        entityData.data.forEach((item: any) => {  // item is object
                            if (_dates.indexOf(item.timestamp) == -1) {
                                _dates.push(item.timestamp);
                            }
                        });
                    }
                });
            });
            // 
            _dates.sort();
            // rest labels
            mainLabels = [];
            if (entities.length == 1) {
                // get collection config
                collection.series.forEach((series: any, _index: number) => {
                    mainLabels.push(series.label);
                    var f = new Function("data", "with(data) { if(" + series.exp + "!=null)return " + series.exp + ";return null;}");
                    // generate data for this column
                    _dates.forEach(date => {
                        // find date in finalData
                        let point = finalData.find(record => record[0] == date);
                        let record = graphData[0].find((data: any) => data.timestamp == date);

                        if (point) {
                            point[_index + 1] = record ? f(record) : null;
                        } else {
                            point = [date];
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

                entities.forEach(entity => {
                    mainLabels.push(entity);
                });

                const exp = collection.series[0].exp;
                var f = new Function("data", "with(data) { if(" + exp + "!=null)return " + exp + ";return null;}");
                _dates.forEach(date => {
                    // get the record
                    let point = finalData.find(record => record[0] == date);
                    // if not found just add it as new one.
                    if (!point) {
                        point = [date];
                        finalData.push(point);
                    }

                    entities.forEach((entity, _index) => {
                        
                        if (graphData.length > _index) {
                            
                            let record = graphData[_index].find((data: any) => data.timestamp == date);
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
                        } else {
                            point[_index + 1] = null;
                        }
                    });
                });
            }

            return { data: finalData, axis: { y: yAxis, y2: yAxis2 } };
        }

        if (graphCollection) {
            this.spinner.show();
            // get data for 
            view.dataService.fetchdata(mainEntities, mainDeviceType, graphCollection.name, { start: start, end: end }, Array.from(new Set(fieldsForMainGraph))).then(resp => {
                let graphData = prepareGraphData(resp, mainEntities, graphCollection);
                let yScale: { valueRange: Array<number> } = { valueRange: [] };
                let y2Scale: { valueRange: Array<number> } = { valueRange: [] };
                // get init scale
                if (graphCollection && !graphCollection.initScales) {
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
                    if (graphCollection && graphCollection.initScales && graphCollection.initScales.left) {
                        yScale.valueRange = [graphCollection.initScales.left.min, graphCollection.initScales.left.max];

                    }
                    if (graphCollection && graphCollection.initScales && graphCollection.initScales.right) {
                        y2Scale.valueRange = [graphCollection.initScales.right.min, graphCollection.initScales.right.max]
                    }
                }
                // clear old graph
                mainGraph.hidden_ctx_.clearRect(0, 0, mainGraph.hidden_.width, mainGraph.hidden_.height);

                if (graphData.data) {
                    this.currentGraphData = [];
                    graphData.data.forEach(_data => {
                        _data[0] = new Date(_data[0])
                        this.currentGraphData.push(_data);
                    });
                }

                // update main graph
                mainGraph.updateOptions({
                    file: this.currentGraphData,
                    series: mainGraphSeries,
                    labels: ['x'].concat(mainLabels),   
                    fillGraph: graphCollection && graphCollection.fill ? graphCollection.fill : false,
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
        }




        if (view.graphConfig.features.rangeBar) {
            // get fields for range-bar 
            const rangeEntities: Array<string> = [view.graphConfig.rangeEntity.id];
            const rangeDeviceType: string = view.graphConfig.rangeEntity.type;
            // get fields for main graph
            let fieldsForRangebarGraph: string[] = [];

            rangeCollection.series.forEach(series => {
                let _tempFields: string[] | null = (series.exp).match(GraphOperator.FIELD_PATTERN);
                // replace all "data."" with ""
                if (_tempFields) {
                    _tempFields = _tempFields.map(exp => exp.replace("data.", ""));
                    // put fields together
                    fieldsForRangebarGraph = fieldsForRangebarGraph.concat(_tempFields);
                }
            });
            // for range
            view.dataService.fetchdata(rangeEntities, rangeDeviceType, rangeCollection.name, { start: start, end: end }, Array.from(new Set(fieldsForRangebarGraph))).then(resp => {
                // merge data
                const currentDatewindowData = prepareGraphData(resp, rangeEntities, rangeCollection);
                let preData: Array<any> = rangebarGraph.file_;
                currentDatewindowData.data.forEach(_data => {
                    let _exist: number = -1;
                    preData.forEach((_oldData, _index) => {
                        if (_oldData[0] == _data[0]) {
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
                    return a[0] > b[0] ? 1 : -1;
                });

                let rangeSeries: any = {};
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
