import FgpGraph from "./index";
import {ViewConfig, GraphExports, FilterType, GraphSeries} from "./metadata/configurations";
import {DataHandler} from "./services/dataService";
import moment from 'moment-timezone';
import {Formatters} from "./extras/formatters";


class DataService implements DataHandler {
    randomNumber = (min: number, max: number) => { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min);
    };

    rangeData: any[] = [];

    private deviceData: any[] = [];

    constructor() {
        this.rangeData = [{
            id: "meter1",
            data: {
                first: {timestamp: new Date("2019/11/01").getTime(), voltage: this.randomNumber(252, 255)},
                last: {
                    timestamp: moment().add(1, 'days').startOf('day').valueOf(),
                    voltage: this.randomNumber(252, 255)
                }
            }
        }, {
            id: "meter2",
            data: {
                first: {timestamp: new Date("2019/11/01").getTime(), voltage: this.randomNumber(252, 255)},
                last: {
                    timestamp: moment().add(1, 'days').startOf('day').valueOf(),
                    voltage: this.randomNumber(252, 255)
                }
            }
        }, {
            id: "meter3",
            data: {
                first: {timestamp: new Date("2019/11/01").getTime(), voltage: this.randomNumber(252, 255)},
                last: {
                    timestamp: moment().add(1, 'days').startOf('day').valueOf(),
                    voltage: this.randomNumber(252, 255)
                }
            }
        }, {
            id: "substation1",
            data: {
                first: {timestamp: new Date("2019/11/01").getTime(), avgConsumptionVah: this.randomNumber(252, 255)},
                last: {
                    timestamp: moment().add(1, 'days').startOf('day').valueOf(),
                    avgConsumptionVah: this.randomNumber(252, 255)
                }
            }
        }]
    }


    fetchFirstNLast(ids: string[], type: string, interval: string, fields?: string[]): Promise<{ id: string; data: { first: any; last: any; }; }[]> {
        return new Promise((resolve, reject) => {
            // sample data for first and last
            resolve(this.rangeData);
        });
    }


    fetchdata(ids: string[], type: string, interval: string, range: { start: number; end: number; }, fields?: string[], seriesConfig?: Array<GraphSeries>): Promise<{ id: string; data: any[]; }[]> {
        // console.debug("fetching data from server...");
        let tempDate = moment(range.start).startOf('day').valueOf();
        let existData: any[] = [];
        ids.forEach(id => {
            let exist = this.deviceData.find((_data) => {
                return _data.id == id && _data.interval == interval;
            });
            if (!exist) {
                exist = {id: id, interval: interval, data: []};
                this.deviceData.push(exist);
            }
            existData.push(exist);
        });

        while (tempDate <= range.end) {
            // create data for different devices with correct interval
            existData.forEach(_ed => {
                if (_ed.id.indexOf('meter') != -1) {

                    // if (_ed.id.indexOf('meter2') == -1) {
                        // get existing data
                        if (_ed.interval == interval) {
                            // find data
                            let recordExist = false;
                            _ed.data.forEach((_data: any) => {
                                if (_data.timestamp == tempDate) {
                                    // found it
                                    recordExist = true;
                                }
                            });
                            if (!recordExist) {
                                // add new one
                                _ed.data.push({
                                    'timestamp': tempDate,
                                    'voltage': this.randomNumber(252, 255),
                                    'amp': this.randomNumber(1, 2),
                                    'avgVoltage': this.randomNumber(250, 255)
                                });
                            }
                        // }
                    }

                } else if (_ed.id.indexOf('substation') != -1) {
                    if (_ed.interval == interval) {
                        // find data
                        let recordExist = false;
                        _ed.data.forEach((_data: any) => {
                            if (_data.timestamp == tempDate) {
                                // found it
                                recordExist = true;
                            }
                        });
                        if (!recordExist) {
                            let max: number = this.randomNumber(253, 255);
                            let min: number = this.randomNumber(250, 252);
                            let avg: number = Math.floor((max + min) / 2);
                            // add new one
                            _ed.data.push({
                                'timestamp': tempDate,
                                'avgConsumptionVah': avg,
                                'maxConsumptionVah': max,
                                'minConsumptionVah': min
                            });
                        }
                    }
                }
            });

            if ("substation_interval_day" === interval) {
                tempDate += 86400000;
            } else if ("substation_interval" === interval) {
                tempDate += 3600000;
            } else if ("meter_read_day" === interval) {
                tempDate += 86400000;
            } else if ("meter_read" === interval) {
                tempDate += 3600000;
            }

        }

        return new Promise((resolve, reject) => {
            let sampleData: Array<{ id: string, data: Array<any> }> = [];
            // find data for current device and interval
            this.deviceData.forEach(_data => {
                ids.forEach(_id => {
                    if (_id == _data.id && _data.interval == interval) {
                        // found data
                        let _records: any[] = [];
                        _data.data.forEach((_d: any) => {
                            if (_d.timestamp >= range.start && _d.timestamp <= range.end) {
                                _records.push(_d);
                            }
                        });
                        console.info(_id);
                        sampleData.push({id: _id, data: _records});
                    }
                });
            });

            // show loading 
            setTimeout(() => {
                resolve(sampleData);
                // console.debug("data has been sent to graph!");
            }, 200);

        });
    }


    source: string = "meter_interval";

}


let graphDiv: HTMLDivElement = document.getElementById("graphArea") as HTMLDivElement;
let graphDiv2: HTMLDivElement = document.getElementById("graphArea2") as HTMLDivElement;
let graphDiv3: HTMLDivElement = document.getElementById("graphArea3") as HTMLDivElement;


let formatters: Formatters = new Formatters("Australia/Perth");
formatters.setFormat('DD MMM YYYY h:mm a');
// data not needed in the future
const dataService: DataHandler = new DataService();
dataService.source = "store";
let vdConfig: ViewConfig = {
    name: "device view",
    connectSeparatedPoints: true,
    graphConfig: {
        hideHeader: {views: false, intervals: false, toolbar: false, series: false},
        // hideHeader: false,
        features: {
            zoom: true,
            scroll: true,
            rangeBar: {show: true, format: 'DD MMM YYYY h:mm a'},
            legend: formatters.legendForAllSeries,
            exports: [GraphExports.Data, GraphExports.Image],
            rangeLocked: true   // lock or unlock range bar
        },
        entities: [
            {id: "substation1", type: "substation", name: "substation1"},
        ],
        rangeEntity: {id: "substation1", type: "substation", name: "substation1"},
        rangeCollection: {
            label: 'substation_day',
            name: 'substation_interval_day',
            interval: 86400000,
            series: [
                {label: "Avg", type: 'line', exp: "data.avgConsumptionVah"}
            ]
        },
        collections: [
            {
                label: 'substation_raw',
                name: 'substation_interval',
                interval: 3600000,
                markLines: [{value: 256, label: '256', color: '#FF0000'}, {value: 248, label: '248', color: '#FF0000'}],
                series: [
                    {
                        label: "Avg",
                        type: 'line',
                        exp: "data.avgConsumptionVah",
                        yIndex: 'left',
                        color: '#058902',
                        visibility: false
                    },
                    {label: "Max", type: 'line', exp: "data.maxConsumptionVah", yIndex: 'left', color: '#d80808'},
                    {
                        label: "Min",
                        type: 'line',
                        exp: "data.minConsumptionVah",
                        yIndex: 'left',
                        color: '#210aa8',
                        extraConfig: {name: "helloword"}
                    }
                ],
                threshold: {min: 0, max: (1000 * 60 * 60 * 24 * 10)},    //  0 ~ 10 days
                yLabel: 'voltage',
                y2Label: 'voltage',
                initScales: {left: {min: 245, max: 260}},
                fill: false
            }, {
                label: 'substation_day',
                name: 'substation_interval_day',
                interval: 86400000,
                // markLines: [{value: 255, label: '255', color: '#FF0000'}, {value: 235, label: '235', color: '#FF0000'}],
                series: [
                    {label: "Avg", type: 'line', exp: "data.avgConsumptionVah", yIndex: 'left'},
                    {label: "Max", type: 'line', exp: "data.maxConsumptionVah", yIndex: 'left', color: '#ff0000'},
                    // {
                    //     label: "Min",
                    //     type: 'dots',
                    //     exp: "data.minConsumptionVah",
                    //     yIndex: 'left',
                    //     extraConfig: {any: "anything"}
                    // }
                ],
                threshold: {min: (1000 * 60 * 60 * 24 * 10), max: (1000 * 60 * 60 * 24 * 7 * 52 * 10)},    // 7 days ~ 3 weeks
                yLabel: 'voltage',
                y2Label: 'voltage',
                initScales: {left: {min: 230, max: 260}},
                fill: false
            }
        ],
        filters: {
            "buttons": [
                {
                    label: "All"
                    , func: () => {
                        return ["Min", "Max", "Avg"];
                    }
                },
                {
                    label: "Min"
                    , func: (): Array<string> => {
                        return ["Min"];
                    }
                },
                {
                    label: "Max"
                    , func: () => {
                        return ["Max"];
                    }
                },
                {
                    label: "Avg"
                    , func: () => {
                        return ["Avg"];
                    }
                },
                {
                    label: "Colors",
                    type: FilterType.COLORS,
                    func: (labels?: Array<string>) => {
                        let colors: Array<string> = [];
                        // generate colors 
                        if (labels) {
                            labels.forEach(element => {
                                colors.push("#FF0000");
                            });

                        }
                        return colors;
                    }
                },
                {
                    label: "reset Colors",
                    type: FilterType.COLORS,
                    func: (labels?: Array<string>) => {
                        return [];
                    }
                }
            ]
        }

    },
    dataService: dataService,
    show: true,
    ranges: [
        {name: "10 mins", value: 1000 * 60 * 10},
        {name: "half an hour", value: 1000 * 60 * 30},
        {name: "1 hours", value: 1000 * 60 * 60},
        {name: "2 hours", value: 1000 * 60 * 60 * 2},
        {name: "1 day", value: 1000 * 60 * 60 * 24},
        {name: "7 days", value: 604800000, show: true},
        {name: "1 month", value: 2592000000}
    ],
    initRange: {
        start: moment("2019-11-01").add(0, 'days').startOf('day').valueOf(),
        end: moment("2019-12-01").subtract(0, 'days').endOf('day').valueOf()
    },
    interaction: {
        callback: {
            highlightCallback: (datetime, series, points) => {
                // console.debug("selected series: ", series);
            },
            syncDateWindow: (dateWindow) => {
                // console.debug(moment(dateWindow[0]), moment(dateWindow[1]));
            },
            dbClickCallback: (series) => {
                // console.debug("dbl callback");
            }
        }
    },
    timezone: 'Australia/Perth',
    highlightSeriesBackgroundAlpha: 1
    // timezone: 'Pacific/Auckland'
};

let vdConfig2: ViewConfig = {
    name: "device view",
    connectSeparatedPoints: true,
    graphConfig: {
        hideHeader: {views: false, intervals: false, toolbar: false, series: false},
        // hideHeader: false,
        features: {
            zoom: true,
            scroll: true,
            rangeBar: false,
            legend: formatters.legendForAllSeries,
            exports: [GraphExports.Data, GraphExports.Image],
            rangeLocked: false   // lock or unlock range bar
        },
        entities: [
            {id: "substation1", type: "substation", name: "substation1"},
        ],
        rangeEntity: {id: "substation1", type: "substation", name: "substation1"},
        rangeCollection: {
            label: 'substation_day',
            name: 'substation_interval_day',
            interval: 86400000,
            series: [
                {label: "Avg", type: 'line', exp: "data.avgConsumptionVah"}
            ]
        },
        collections: [
            {
                label: 'substation_raw',
                name: 'substation_interval',
                interval: 3600000,
                markLines: [{value: 256, label: '256', color: '#FF0000'}, {value: 248, label: '248', color: '#FF0000'}],
                series: [
                    {
                        label: "Avg",
                        type: 'line',
                        exp: "data.avgConsumptionVah",
                        yIndex: 'left',
                        color: '#058902',
                        visibility: false
                    },
                    {label: "Max", type: 'line', exp: "data.maxConsumptionVah", yIndex: 'left', color: '#d80808'},
                    {
                        label: "Min",
                        type: 'line',
                        exp: "data.minConsumptionVah",
                        yIndex: 'left',
                        color: '#210aa8',
                        extraConfig: {name: "helloword"}
                    }
                ],
                threshold: {min: 0, max: (1000 * 60 * 60 * 24 * 10)},    //  0 ~ 10 days
                yLabel: 'voltage',
                y2Label: 'voltage',
                initScales: {left: {min: 245, max: 260}},
                fill: false
            }, {
                label: 'substation_day',
                name: 'substation_interval_day',
                interval: 86400000,
                // markLines: [{value: 255, label: '255', color: '#FF0000'}, {value: 235, label: '235', color: '#FF0000'}],
                series: [
                    {label: "Avg", type: 'line', exp: "data.avgConsumptionVah", yIndex: 'left'},
                    {label: "Max", type: 'line', exp: "data.maxConsumptionVah", yIndex: 'left', color: '#ff0000'},
                    // {
                    //     label: "Min",
                    //     type: 'dots',
                    //     exp: "data.minConsumptionVah",
                    //     yIndex: 'left',
                    //     extraConfig: {any: "anything"}
                    // }
                ],
                threshold: {min: (1000 * 60 * 60 * 24 * 10), max: (1000 * 60 * 60 * 24 * 7 * 52 * 10)},    // 7 days ~ 3 weeks
                yLabel: 'voltage',
                y2Label: 'voltage',
                initScales: {left: {min: 230, max: 260}},
                fill: false
            }
        ],
        filters: {
            "buttons": [
                {
                    label: "All"
                    , func: () => {
                        return ["Min", "Max", "Avg"];
                    }
                },
                {
                    label: "Min"
                    , func: (): Array<string> => {
                        return ["Min"];
                    }
                },
                {
                    label: "Max"
                    , func: () => {
                        return ["Max"];
                    }
                },
                {
                    label: "Avg"
                    , func: () => {
                        return ["Avg"];
                    }
                },
                {
                    label: "Colors",
                    type: FilterType.COLORS,
                    func: (labels?: Array<string>) => {
                        let colors: Array<string> = [];
                        // generate colors
                        if (labels) {
                            labels.forEach(element => {
                                colors.push("#FF0000");
                            });

                        }
                        return colors;
                    }
                },
                {
                    label: "reset Colors",
                    type: FilterType.COLORS,
                    func: (labels?: Array<string>) => {
                        return [];
                    }
                }
            ]
        }

    },
    dataService: dataService,
    show: true,
    ranges: [
        {name: "7 days", value: 604800000, show: true},
        {name: "1 month", value: 2592000000}
    ],
    initRange: {
        start: moment("2019-11-01").add(0, 'days').startOf('day').valueOf(),
        end: moment("2019-12-01").subtract(0, 'days').endOf('day').valueOf()
    },
    interaction: {
        callback: {
            highlightCallback: (datetime, series, points) => {
                // console.debug("selected series: ", series);
            },
            syncDateWindow: (dateWindow) => {
                // console.debug(moment(dateWindow[0]), moment(dateWindow[1]));
            },
            dbClickCallback: (series) => {
                // console.debug("dbl callback");
            }
        }
    },
    timezone: 'Australia/Perth',
    highlightSeriesBackgroundAlpha: 1
    // timezone: 'Pacific/Auckland'
};
let vsConfig2_2: ViewConfig = {
    name: "scatter view",
    graphConfig: {
        features: {
            zoom: true,
            scroll: false,
            rangeBar: false,
            legend: formatters.legendForSingleSeries
        },
        entities: [
            {id: "meter1", type: "meter", name: "meter1"},
            {id: "meter2", type: "meter", name: "meter2"}
        ],
        rangeEntity: {id: "substation1", type: "substation", name: "**F**substation"},
        rangeCollection: {
            label: 'substation_day',
            name: 'substation_interval_day',
            interval: 86400000,
            series: [
                {label: "Avg", type: 'line', exp: "data.avgConsumptionVah"}
            ]
        },
        collections: [
            {
                label: 'meter_raw',
                name: 'meter_read',
                interval: 3600000,
                series: [
                    {label: "Voltage", type: 'line', exp: "data.voltage", yIndex: 'left'}
                ],
                threshold: {min: 0, max: (1000 * 60 * 60 * 24 * 10)},    //  0 ~ 10 days
                initScales: {left: {min: 245, max: 260}},
                yLabel: 'voltage'
            }, {
                label: 'meter_day',
                name: 'meter_read_day',
                interval: 86400000,
                series: [
                    {label: "Avg Voltage", type: 'line', exp: "data.avgVoltage", yIndex: 'left'}
                ],
                threshold: {min: (1000 * 60 * 60 * 24 * 10), max: (1000 * 60 * 60 * 24 * 7 * 52 * 10)},    // 7 days ~ 3 weeks
                initScales: {left: {min: 245, max: 260}},
                yLabel: 'voltage'
            }
        ]
    },
    dataService: dataService,
    show: false,
    ranges: [
        {name: "7 days", value: 604800000, show: true},
        {name: "1 month", value: 2592000000}
    ],
    initRange: {
        start: moment().subtract(10, 'days').startOf('day').valueOf(),
        end: moment().add(1, 'days').valueOf()
    },
    interaction: {
        callback: {
            highlightCallback: (datetime, series, points) => {
                console.debug("selected series: ", series);
            },
            clickCallback: (series) => {
                console.debug("choosed series: ", series);
            }
        }
    },
    timezone: 'Australia/Melbourne'
    // timezone: 'Pacific/Auckland'
};


const changeGraphSize = (graphDiv: HTMLElement, size: number) => {
    graphDiv.style.height = size + "px";
};


let vsConfig: ViewConfig = {
    name: "scatter view",
    graphConfig: {
        features: {
            zoom: true,
            scroll: true,
            rangeBar: true,
            legend: formatters.legendForSingleSeries,
            exports: [GraphExports.Data, GraphExports.Image],
            toolbar: {
                buttons: [{
                    label: 'height: 300px', prop: {}, func: (prop: any) => {
                        // do nothing, just show it in dropdown
                        changeGraphSize(graphDiv, 300);
                    }
                }],
                dropdown: [[{
                    label: 'height', prop: {}, func: (prop: any) => {
                        // do nothing, just show it in dropdown
                        changeGraphSize(graphDiv, 300);
                    }
                }, {
                    label: '500px', prop: {}, func: (prop: any) => {
                        // do what you need to do here. such as change height
                        changeGraphSize(graphDiv, 500);
                    }
                }, {
                    label: '800px', prop: {}, func: (prop: any) => {
                        // do what you need to do here. such as change height
                        changeGraphSize(graphDiv, 800);
                    }
                }]]
            }
        },
        entities: [
            {id: "meter1", type: "meter", name: "meter1"},
            // {id: "meter2", type: "meter", name: "meter2"},
            {id: "?", type: "meter", name: "?", fragment: true}
        ],
        rangeEntity: {id: "substation1", type: "substation", name: "substation1"},
        rangeCollection: {
            label: 'substation_day',
            name: 'substation_interval_day',
            interval: 86400000,
            series: [
                {label: "Avg", type: 'line', exp: "data.avgConsumptionVah"}
            ]
        },
        collections: [
            {
                label: 'meter_raw',
                name: 'meter_read',
                interval: 3600000,
                series: [
                    {label: "Voltage", type: 'line', exp: "data.voltage", yIndex: 'left'}
                ],
                threshold: {min: 0, max: (1000 * 60 * 60 * 24 * 10)},    //  0 ~ 10 days
                initScales: {left: {min: 245, max: 260}},
                yLabel: 'voltage'
            }, {
                label: 'meter_day',
                name: 'meter_read_day',
                interval: 86400000,
                series: [
                    {label: "Avg Voltage", type: 'line', exp: "data.avgVoltage", yIndex: 'left'}
                ],
                threshold: {min: (1000 * 60 * 60 * 24 * 10), max: (1000 * 60 * 60 * 24 * 7 * 52 * 10)},    // 7 days ~ 3 weeks
                initScales: {left: {min: 245, max: 260}},
                yLabel: 'voltage'
            }
        ],
        filters: {
            "dropdown": [{
                label: "All"
                , func: () => {
                    return ["meter1", "meter2"];
                }
            }, {
                label: "Meter1"
                , func: () => {
                    return ["meter1"];
                }
            }, {
                label: "Meter2"
                , func: () => {
                    return ["meter2"];
                }
            }]
        }
    },
    dataService: dataService,
    show: false,
    ranges: [
        {name: "7 days", value: 604800000, show: true},
        {name: "1 month", value: 2592000000}
    ],
    initRange: {
        start: moment().subtract(5, 'days').startOf('day').valueOf(),
        end: moment().add(1, 'days').valueOf()
    },
    interaction: {
        callback: {
            highlightCallback: (datetime, series, points) => {
                console.debug("selected series: ", series);    // too many messages in console
            },
            clickCallback: (series) => {
                console.debug("choose series: ", series);
            }
        }
    },
    timezone: 'Australia/Melbourne'
    // timezone: 'Pacific/Auckland'
};
let vsConfig2: ViewConfig = {
    name: "scatter view",
    graphConfig: {
        features: {
            zoom: true,
            scroll: false,
            rangeBar: false,
            legend: formatters.legendForSingleSeries
        },
        entities: [
            {id: "meter1", type: "meter", name: "meter1"},
            {id: "meter2", type: "meter", name: "meter2"}
        ],
        rangeEntity: {id: "substation1", type: "substation", name: "**F**substation"},
        rangeCollection: {
            label: 'substation_day',
            name: 'substation_interval_day',
            interval: 86400000,
            series: [
                {label: "Avg", type: 'line', exp: "data.avgConsumptionVah"}
            ]
        },
        collections: [
            {
                label: 'meter_raw',
                name: 'meter_read',
                interval: 3600000,
                series: [
                    {label: "Voltage", type: 'line', exp: "data.voltage", yIndex: 'left'}
                ],
                threshold: {min: 0, max: (1000 * 60 * 60 * 24 * 10)},    //  0 ~ 10 days
                initScales: {left: {min: 245, max: 260}},
                yLabel: 'voltage'
            }, {
                label: 'meter_day',
                name: 'meter_read_day',
                interval: 86400000,
                series: [
                    {label: "Avg Voltage", type: 'line', exp: "data.avgVoltage", yIndex: 'left'}
                ],
                threshold: {min: (1000 * 60 * 60 * 24 * 10), max: (1000 * 60 * 60 * 24 * 7 * 52 * 10)},    // 7 days ~ 3 weeks
                initScales: {left: {min: 245, max: 260}},
                yLabel: 'voltage'
            }
        ]
    },
    dataService: dataService,
    show: true,
    ranges: [
        {name: "7 days", value: 604800000, show: true},
        {name: "1 month", value: 2592000000}
    ],
    initRange: {
        start: moment().subtract(10, 'days').startOf('day').valueOf(),
        end: moment().add(1, 'days').valueOf()
    },
    interaction: {
        callback: {
            highlightCallback: (datetime, series, points) => {
                // console.debug("selected series: ", series);
            },
            clickCallback: (series) => {
                // console.debug("choosed series: ", series);
            }
        }
    },
    timezone: 'Australia/Melbourne'
    // timezone: 'Pacific/Auckland'
};
let vsConfig3: ViewConfig = {
    name: "scatter view",
    graphConfig: {
        features: {
            zoom: true,
            scroll: false,
            rangeBar: false,
            legend: formatters.legendForSingleSeries

        },
        entities: [
            {id: "meter1", type: "meter", name: "meter1"},
            {id: "meter2", type: "meter", name: "meter2"}
        ],
        rangeEntity: {id: "substation1", type: "substation", name: "**F**substation"},
        rangeCollection: {
            label: 'substation_day',
            name: 'substation_interval_day',
            interval: 86400000,
            series: [
                {label: "Avg", type: 'line', exp: "data.avgConsumptionVah"}
            ]
        },
        collections: [
            {
                label: 'meter_raw',
                name: 'meter_read',
                interval: 3600000,
                series: [
                    {label: "Voltage", type: 'line', exp: "data.voltage", yIndex: 'left'}
                ],
                threshold: {min: 0, max: (1000 * 60 * 60 * 24 * 10)},    //  0 ~ 10 days
                initScales: {left: {min: 245, max: 260}},
                yLabel: 'voltage'
            }, {
                label: 'meter_day',
                name: 'meter_read_day',
                interval: 86400000,
                series: [
                    {label: "Avg Voltage", type: 'line', exp: "data.avgVoltage", yIndex: 'left'}
                ],
                threshold: {min: (1000 * 60 * 60 * 24 * 10), max: (1000 * 60 * 60 * 24 * 7 * 52 * 10)},    // 7 days ~ 3 weeks
                initScales: {left: {min: 245, max: 260}},
                yLabel: 'voltage'
            }
        ]
    },
    dataService: dataService,
    show: true,
    ranges: [
        {name: "7 days", value: 604800000, show: true},
        {name: "1 month", value: 2592000000}
    ],
    initRange: {
        start: moment().subtract(10, 'days').startOf('day').valueOf(),
        end: moment().add(1, 'days').valueOf()
    },
    interaction: {
        callback: {
            highlightCallback: (datetime, series, points) => {
                console.debug("selected series: ", series);
            },
            clickCallback: (series) => {
                console.debug("choosed series: ", series);
            }
        }
    },
    timezone: 'Australia/Melbourne'
    // timezone: 'Pacific/Auckland'
};


// let graph3 = new FgpGraph(graphDiv3, [vsConfig3]);
// graph3.initGraph();
// //
// let graph2 = new FgpGraph(graphDiv2, [vsConfig2]);
// graph2.initGraph();
// graph1


let viewChangeListener = (g: FgpGraph, view: ViewConfig) => {
    console.log("view changed!", view.name);

    // g.children.forEach(child => {
    //
    //     child.viewConfigs.forEach(_view => {
    //         if(_view.name === view.name){
    //             child.changeView(view.name);
    //         }
    //     });
    //
    // });

    // crete new graph


    let graph2 = new FgpGraph(graphDiv2, [vsConfig2]);
    graph2.initGraph();
    graph1.setChildren([graph2]);



};

let intervalChangeListener = (g: FgpGraph, interval: { name: string; value: number; show?: boolean }) => {
    console.log('interval changed!', interval);
};


let graph1 = new FgpGraph(graphDiv, [vdConfig, vsConfig], {
    onViewChange: viewChangeListener,
    onIntervalChange: intervalChangeListener
});
graph1.initGraph();


// let graph1_1 = new FgpGraph(graphDiv2, [vdConfig2, vsConfig2_2]);
// graph1_1.initGraph();
//
// graph1.setChildren([graph1_1]);

// setTimeout(()=> {
//     graph1.changeView('scatter view');
// }, 5000);


// setTimeout(()=>{
//     graph1.updateDatewinow([moment("2019-12-2").valueOf(), moment('2020-01-3').valueOf()]);
// }, 5000);


// testing resize graph without resizing window
// setTimeout(()=>{
//     graphDiv.style.height = "700px";
//
//     setTimeout(()=>{
//         graphDiv.style.display = "none";
//
//         setTimeout(()=>{
//             graphDiv.style.display = "block";
//             graphDiv.style.height = "300px";
//         }, 2000);
//
//     }, 2000);
//
// }, 5000);


// // link graphs
// graph1.setChildren([graph2, graph3]);


// graph2.setChildren([graph1]);   // problem with right and left axis

// let ueGraph = new FgpGraph(graphDiv, [vdConfigUE]);
// ueGraph.initGraph();


// highlight on first graph


// setTimeout(() => {
//
//     graph1.highlightSeries(["Avg", "Min"], 0, "");
//
// }, 5000);

