import React, {Component} from "react";
import {Formatters} from "@future-grid/fgp-graph/lib/extras/formatters";
import {DataHandler} from "@future-grid/fgp-graph/lib/services/dataService";
import DataService from "../services/DataService";
import {FilterType, GraphExports, ViewConfig} from "@future-grid/fgp-graph/lib/metadata/configurations";
import moment from "moment-timezone";
import FgpGraph from "@future-grid/fgp-graph";
import GenericGraph from "./GenericGraph";

import {Badge, Card, Container, Row} from 'react-bootstrap';
import ReactJson from "react-json-view";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {IconProp} from "@fortawesome/fontawesome-svg-core";

type Props = {}

type States = {
    childrenGraph: Array<{ id: string, viewConfigs: Array<ViewConfig>, onReady(div: HTMLDivElement, g: FgpGraph): void }>,
    syncDateWindow: [number, number]
}

export default class GraphContainer extends Component<Props, States> {

    private graphDiv?: HTMLDivElement;

    private formatters: Formatters;

    private readonly dataService: DataHandler;

    private mainViewConfigs: Array<ViewConfig>;

    private childViewConfigs: Array<ViewConfig>;


    constructor(props: Props) {
        super(props);

        this.state = {
            childrenGraph: [],
            syncDateWindow: [0, 0]
        };

        this.formatters = new Formatters("Australia/Melbourne");
        this.formatters.setFormat('DD MMM YYYY h:mm a');

        this.dataService = new DataService();
        this.dataService.source = "store";
        this.mainViewConfigs = [];
        this.childViewConfigs = [];
        this.prepareViewConfigs();
    }


    prepareViewConfigs = () => {
        const vdConfig: ViewConfig = {
            name: "device view",
            connectSeparatedPoints: false,
            graphConfig: {
                hideHeader: {views: false, intervals: false, toolbar: false, series: false},
                // hideHeader: true,
                features: {
                    zoom: true,
                    scroll: true,
                    // rangeBar: {show: true, format: 'DD MMM YYYY h:mm a'},
                    rangeBar: true,
                    legend: this.formatters.legendForAllSeries,
                    exports: [GraphExports.Data, GraphExports.Image, GraphExports.Draw],
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
                        markLines: [{value: 256, label: '256', color: '#FF0000'}, {
                            value: 248,
                            label: '248',
                            color: '#FF0000'
                        }],
                        series: [
                            {
                                label: "Avg",
                                type: 'line',
                                exp: "data.avgConsumptionVah",
                                yIndex: 'left',
                                color: '#058902',
                                visibility: false
                            },
                            {
                                label: "Max",
                                type: 'line',
                                exp: "data.maxConsumptionVah",
                                yIndex: 'left',
                                color: '#d80808'
                            },
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
                        // initScales: {left: {min: 245, max: 260}},
                        fill: false
                    }, {
                        label: 'substation_day',
                        name: 'substation_interval_day',
                        interval: 86400000,
                        // markLines: [{value: 255, label: '255', color: '#FF0000'}, {value: 235, label: '235', color: '#FF0000'}],
                        series: [
                            {label: "Avg", type: 'line', exp: "data.avgConsumptionVah", yIndex: 'left'},
                            {
                                label: "Max",
                                type: 'line',
                                exp: "data.maxConsumptionVah",
                                yIndex: 'left',
                                color: '#ff0000'
                            },
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
                        // initScales: {left: {min: 230, max: 260}},
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
            dataService: this.dataService,
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
            // initRange: {
            //     start: moment("2019-11-01").add(0, 'days').startOf('day').valueOf(),
            //     end: moment("2019-12-01").subtract(0, 'days').endOf('day').valueOf()
            // },
            interaction: {
                callback: {
                    highlightCallback: (datetime, series, points) => {
                        // console.debug("selected series: ", series);
                    },
                    syncDateWindow: (dateWindow) => {
                        // console.debug(moment(dateWindow[0]), moment(dateWindow[1]));
                        // this.setState({
                        //     syncDateWindow: [dateWindow[0], dateWindow[1]]
                        // });
                        //
                        // vsConfig.initRange = {start: dateWindow[0], end: dateWindow[1]};
                    },
                    dbClickCallback: (series) => {
                        // console.debug("dbl callback, ", series);
                    },
                    clickCallback: (series) => {
                        console.debug("click callback, ", series);
                    },
                    multiSelectionCallback: (series: Array<string>) => {
                        console.log(`${series}`);
                    }
                }
            },
            timezone: 'Australia/Melbourne',
            highlightSeriesBackgroundAlpha: 1
            // timezone: 'Pacific/Auckland'
        };

        const vsConfig: ViewConfig = {
            name: "scatter view",
            graphConfig: {
                features: {
                    zoom: true,
                    scroll: true,
                    rangeBar: true,
                    legend: this.formatters.legendForSingleSeries,
                    exports: [GraphExports.Data, GraphExports.Image],
                    toolbar: {
                        buttons: [{
                            label: 'height: 300px', prop: {}, func: (prop: any) => {
                                // do nothing, just show it in dropdown
                                if (this.graphDiv) {
                                    this.changeGraphSize(this.graphDiv, 300);
                                }

                            }
                        }],
                        dropdown: [[{
                            label: 'height', prop: {}, func: (prop: any) => {
                                // do nothing, just show it in dropdown
                                if (this.graphDiv) {
                                    this.changeGraphSize(this.graphDiv, 300);
                                }

                            }
                        }, {
                            label: '500px', prop: {}, func: (prop: any) => {
                                // do what you need to do here. such as change height
                                if (this.graphDiv) {
                                    this.changeGraphSize(this.graphDiv, 500);
                                }

                            }
                        }, {
                            label: '800px', prop: {}, func: (prop: any) => {
                                // do what you need to do here. such as change height
                                if (this.graphDiv) {
                                    this.changeGraphSize(this.graphDiv, 800);
                                }
                            }
                        }]]
                    }
                },
                entities: [
                    {id: "meter1", type: "meter", name: "meter1"},
                    {id: "meter3", type: "meter", name: "meter3"},
                    {id: "meter4", type: "meter", name: "meter4"},
                    {id: "meter5", type: "meter", name: "meter5"},
                    {id: "meter6", type: "meter", name: "meter6"},
                    {id: "meter7", type: "meter", name: "meter7"},
                    {id: "meter8", type: "meter", name: "meter8"},
                    {id: "meter9", type: "meter", name: "meter9"},
                    {id: "meter10", type: "meter", name: "meter10"},
                    {id: "meter11", type: "meter", name: "meter11"},
                    {id: "meter12", type: "meter", name: "meter12"},
                    {id: "meter13", type: "meter", name: "meter13"},
                    {id: "meter14", type: "meter", name: "meter14"},
                    {id: "meter1555555555555555555555555555555555", type: "meter", name: "meter1555555555555555555555555555555555"},
                    {id: "meter1655555555555555555555555555555555", type: "meter", name: "meter1655555555555555555555555555555555"},
                    {id: "meter1755555555555555555555555555555555", type: "meter", name: "meter1755555555555555555555555555555555"},
                    {id: "meter1855555555555555555555555555555555", type: "meter", name: "meter1855555555555555555555555555555555"},
                    {id: "meter1955555555555555555555555555555555", type: "meter", name: "meter1955555555555555555555555555555555"},
                    {id: "meter2055555555555555555555555555555555", type: "meter", name: "meter2055555555555555555555555555555555"},
                    {id: "meter2155555555555555555555555555555555", type: "meter", name: "meter2155555555555555555555555555555555"},
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
            dataService: this.dataService,
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
                        // childGraph.highlightSeries([series], 0);
                    },
                    dbClickCallback: (series) => {
                        // console.debug("dbl callback, ", series);
                    },
                    clickCallback: (series) => {
                        console.debug("click callback, ", series);
                    },
                    multiSelectionCallback: (series: Array<string>) => {
                        console.log(`${series}`);
                    },
                    syncDateWindow: (dateWindow: number[]) => {
                        // this.setState({
                        //     syncDateWindow: [dateWindow[0], dateWindow[1]]
                        // });
                        // // set init range for device view
                        // vdConfig.initRange = {start: dateWindow[0], end: dateWindow[1]};
                    }
                }
            },
            timezone: 'Australia/Melbourne'
            // timezone: 'Pacific/Auckland'
        };

        const vsConfig2: ViewConfig = {
            name: "scatter view",
            graphConfig: {
                features: {
                    zoom: true,
                    scroll: false,
                    rangeBar: false,
                    legend: this.formatters.legendForSingleSeries
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
            dataService: this.dataService,
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
        // const vsConfig3: ViewConfig = {
        //     name: "scatter view",
        //     graphConfig: {
        //         features: {
        //             zoom: true,
        //             scroll: false,
        //             rangeBar: false,
        //             legend: this.formatters.legendForSingleSeries
        //
        //         },
        //         entities: [
        //             {id: "meter1", type: "meter", name: "meter1"},
        //             {id: "meter2", type: "meter", name: "meter2"}
        //         ],
        //         rangeEntity: {id: "substation1", type: "substation", name: "**F**substation"},
        //         rangeCollection: {
        //             label: 'substation_day',
        //             name: 'substation_interval_day',
        //             interval: 86400000,
        //             series: [
        //                 {label: "Avg", type: 'line', exp: "data.avgConsumptionVah"}
        //             ]
        //         },
        //         collections: [
        //             {
        //                 label: 'meter_raw',
        //                 name: 'meter_read',
        //                 interval: 3600000,
        //                 series: [
        //                     {label: "Voltage", type: 'line', exp: "data.voltage", yIndex: 'left'}
        //                 ],
        //                 threshold: {min: 0, max: (1000 * 60 * 60 * 24 * 10)},    //  0 ~ 10 days
        //                 initScales: {left: {min: 245, max: 260}},
        //                 yLabel: 'voltage'
        //             }, {
        //                 label: 'meter_day',
        //                 name: 'meter_read_day',
        //                 interval: 86400000,
        //                 series: [
        //                     {label: "Avg Voltage", type: 'line', exp: "data.avgVoltage", yIndex: 'left'}
        //                 ],
        //                 threshold: {min: (1000 * 60 * 60 * 24 * 10), max: (1000 * 60 * 60 * 24 * 7 * 52 * 10)},    // 7 days ~ 3 weeks
        //                 initScales: {left: {min: 245, max: 260}},
        //                 yLabel: 'voltage'
        //             }
        //         ]
        //     },
        //     dataService: this.dataService,
        //     show: true,
        //     ranges: [
        //         {name: "7 days", value: 604800000, show: true},
        //         {name: "1 month", value: 2592000000}
        //     ],
        //     initRange: {
        //         start: moment().subtract(10, 'days').startOf('day').valueOf(),
        //         end: moment().add(1, 'days').valueOf()
        //     },
        //     interaction: {
        //         callback: {
        //             highlightCallback: (datetime, series, points) => {
        //                 console.log(`select series: [${series}]`);
        //             },
        //             clickCallback: (series) => {
        //                 console.log(`click series: [${series}]`);
        //             }
        //         }
        //     },
        //     timezone: 'Australia/Melbourne'
        //     // timezone: 'Pacific/Auckland'
        // };

        this.mainViewConfigs = this.mainViewConfigs.concat(vdConfig, vsConfig);
        this.childViewConfigs = this.childViewConfigs.concat(vsConfig2);

    };


    readyCallback = (div: HTMLDivElement, g: FgpGraph) => {
        this.graphDiv = div;
        // setTimeout(()=>{
        //     mainGraph.changeView("scatter view");
        // }, 5000);


        // this.setState({
        //     childrenGraph: [{
        //         id: '' + Math.random() * 1000,
        //         viewConfigs: this.childViewConfigs,
        //         onReady: (div: HTMLDivElement, g: FgpGraph) => {
        //             mainGraph.setChildren([g]);
        //         }
        //     }]
        // });


    };

    changeGraphSize = (graphDiv: HTMLElement, size: number) => {
        graphDiv.style.height = size + "px";
    };


    onViewChange = (g: FgpGraph, view: ViewConfig): void => {
        console.log(`view changed to [${view.name}]`);
        const mainGraph = g;
        const dateWindow = mainGraph.currentDateWindow;
        if ("device view" === view.name) {
            // add new child graph
            this.setState({
                childrenGraph: []
            });
        } else {

            setTimeout(()=>{
                mainGraph.updateDatewinow([dateWindow[0], dateWindow[1]]);
            }, 200);


            // update initRange for children graphs
            this.childViewConfigs.forEach(view => {
                view.initRange = {start: dateWindow[0], end: dateWindow[1]}
            });
            // add new child graph
            this.setState({
                childrenGraph: [{
                    id: '' + Math.random() * 1000,
                    viewConfigs: this.childViewConfigs,
                    onReady: (div: HTMLDivElement, childGraph: FgpGraph) => {
                        mainGraph.setChildren([childGraph]);
                    }
                }]
            });
        }

        setTimeout(()=>{

            g.updateDatewinow([moment("2019-11-20").valueOf(), moment("2019-12-30").valueOf()])


            setTimeout(()=>{

                g.updateDatewinow([moment("2019-11-20").valueOf(), moment("2019-11-24").valueOf()])

            }, 5000);

        }, 5000);


    };

    onIntervalChange = (g: FgpGraph, interval: { name: string; value: number; show?: boolean }): void => {
        console.log(`interval changed to [${interval}]`);
    };



    render() {

        return (
            <Container fluid={true}>
                {/*main graph*/}
                <Row className="justify-content-md-center">
                    <h4>
                        <Badge variant="info"><FontAwesomeIcon
                            icon={['fas', 'chart-area'] as IconProp}/> @future-grid/fgp-graph / Main Graph</Badge>
                    </h4>
                </Row>
                <Card>
                    <GenericGraph viewConfigs={this.mainViewConfigs} onReady={this.readyCallback}
                                  viewChangeListener={this.onViewChange}
                                  intervalChangeListener={this.onIntervalChange}/>
                </Card>
                <Card>
                    <ReactJson src={this.mainViewConfigs} name={'viewConfigs'} collapsed={true} iconStyle={"circle"}/>
                </Card>

                <br/>
                {/*children graphs*/}

                {
                    this.state.childrenGraph.length > 0 ? <Row className="justify-content-md-center">
                        <h4>
                            <Badge variant="warning">@future-grid/fgp-graph / Children Graphs</Badge>
                        </h4>
                    </Row> : null
                }

                {
                    this.state.childrenGraph.map((_config: { id: string; viewConfigs: Array<ViewConfig>; onReady(div: HTMLDivElement, g: FgpGraph): void }) => {
                        return (
                            <div key={_config.id}>
                                <Card>
                                    <GenericGraph viewConfigs={_config.viewConfigs} onReady={_config.onReady}/>
                                </Card>
                                <Card>
                                    <ReactJson src={_config.viewConfigs} name={'viewConfigs'} collapsed={true}
                                               iconStyle={"circle"}/>
                                </Card>
                            </div>

                        );
                    })
                }
            </Container>
        )
    }
}