import { FgpGraph } from "./index";
import { GraphConfig, ViewConfig } from "./metadata/configurations";
import { DataHandler } from "./services/dataService";
import moment from 'moment-timezone';
import { Formatters } from "./extras/formatters";

class DataService implements DataHandler {
    randomNumber = (min, max) => { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min);
    };

    intervals = {
        substation_interval_day: 86400000,
        substation_interval: 3600000,
        meter_read_day: 86400000,
        meter_read: 3600000
    };

    fetchFirstNLast(ids: string[], interval: string, fields?: string[]): Promise<{ id: string; data: { first: any; last: any; }; }[]> {
        console.debug("fetching data for first and last~");

        return new Promise((resolve, reject) => {
            // sample data for first and last
            resolve([{ id: "meter1", data: { first: { timestamp: new Date("2019/06/01").getTime(), voltage: this.randomNumber(252, 255) }, last: { timestamp: moment().add(1, 'days').startOf('day').valueOf(), voltage: this.randomNumber(252, 255) } } }, { id: "meter2", data: { first: { timestamp: new Date("2019/06/01").getTime(), voltage: this.randomNumber(252, 255) }, last: { timestamp: moment().add(1, 'days').startOf('day').valueOf(), voltage: this.randomNumber(252, 255) } } }, { id: "meter3", data: { first: { timestamp: new Date("2019/06/01").getTime(), voltage: this.randomNumber(252, 255) }, last: { timestamp: moment().add(1, 'days').startOf('day').valueOf(), voltage: this.randomNumber(252, 255) } } }, { id: "substation1", data: { first: { timestamp: new Date("2019/06/01").getTime(), avgConsumptionVah: this.randomNumber(252, 255) }, last: { timestamp: moment().add(1, 'days').startOf('day').valueOf(), avgConsumptionVah: this.randomNumber(252, 255) } } }]);
        });
    }

    fetchdata(ids: string[], interval: string, range: { start: number; end: number; }, fields?: string[]): Promise<{ id: string; data: any[]; }[]> {
        console.debug("fetching data from server...");

        let tempDate = moment(range.start).startOf('day').valueOf();
        let sampleData: Array<{ id: string, data: Array<any> }> = [];

        ids.forEach(id => {
            sampleData.push({ id: id, data: [] });
        });

        while (tempDate <= range.end) {
            // create data for different devices with correct interval
            sampleData.forEach(deviceData => {
                if (deviceData.id.indexOf('meter') != -1) {
                    //
                    deviceData.data.push({ 'timestamp': tempDate, 'voltage': this.randomNumber(252, 255), 'amp': this.randomNumber(1, 2), 'avgVoltage': this.randomNumber(250, 255) });
                } else if (deviceData.id.indexOf('substation') != -1) {
                    //
                    let max: number = this.randomNumber(253, 255);
                    let min: number = this.randomNumber(250, 252);
                    let avg: number = Math.floor((max + min) / 2);
                    deviceData.data.push({ 'timestamp': tempDate, 'avgConsumptionVah': avg, 'maxConsumptionVah': max, 'minConsumptionVah': min });
                }
            });
            tempDate += this.intervals[interval];
        }

        return new Promise((resolve, reject) => {
            resolve(sampleData);
        });
    }


    source: string = "meter_interval";

}


let graphDiv: HTMLDivElement = document.getElementById("graphArea") as HTMLDivElement;
let graphDiv2: HTMLDivElement = document.getElementById("graphArea2") as HTMLDivElement;

let formatters: Formatters = new Formatters("Australia/Melbourne");
// let formatters:Formatters = new Formatters("Pacific/Auckland");

// data not needed in the future
const dataService: DataHandler = new DataService();
dataService.source = "store";
let vdConfig: ViewConfig = {
    name: "device view",
    graphConfig: {
        features: {
            zoom: true,
            scroll: true,
            rangeBar: true,
            legend: formatters.legendForAllSeries
        },
        entities: [
            { id: "substation1", type: "substation", name: "**F**substation" },
        ],
        rangeEntity: { id: "substation1", type: "substation", name: "**F**substation" },
        rangeCollection: {
            label: 'substation_day',
            name: 'substation_interval_day',
            interval: 86400000,
            series: [
                { label: "Avg", type: 'line', exp: "data.avgConsumptionVah" }
            ]
        },
        collections: [
            {
                label: 'substation_raw',
                name: 'substation_interval',
                interval: 3600000,
                series: [
                    { label: "Avg", type: 'line', exp: "data.avgConsumptionVah", yIndex: 'left' },
                    { label: "Max", type: 'line', exp: "data.maxConsumptionVah", yIndex: 'left' },
                    { label: "Min", type: 'line', exp: "data.minConsumptionVah", yIndex: 'left' }
                ],
                threshold: { min: 0, max: (1000 * 60 * 60 * 24 * 10) },    //  0 ~ 10 days
                yLabel: 'Consumption',
                y2Label: 'Consumption',
                initScales: { left: { min: 245, max: 260 } }
            }, {
                label: 'substation_day',
                name: 'substation_interval_day',
                interval: 86400000,
                series: [
                    { label: "Avg", type: 'line', exp: "data.avgConsumptionVah", yIndex: 'left' },
                    { label: "Max", type: 'line', exp: "data.maxConsumptionVah", yIndex: 'left' },
                    { label: "Min", type: 'line', exp: "data.minConsumptionVah", yIndex: 'left' }
                ],
                threshold: { min: (1000 * 60 * 60 * 24 * 10), max: (1000 * 60 * 60 * 24 * 7 * 52 * 10) },    // 7 days ~ 3 weeks
                yLabel: 'Consumption',
                y2Label: 'Consumption',
                initScales: { left: { min: 230, max: 260 } }
            }
        ]
    },
    dataService: dataService,
    show: true,
    ranges: [
        { name: "7 days", value: 604800000, show: true },
        { name: "1 month", value: 2592000000 }
    ],
    initRange: {
        start: moment().subtract(10, 'days').startOf('day').valueOf(),
        end: moment().add(1, 'days').valueOf()
    },
    timezone: 'Australia/Melbourne'
    // timezone: 'Pacific/Auckland'
};

let vsConfig: ViewConfig = {
    name: "scatter view",
    graphConfig: {
        features: {
            zoom: true,
            scroll: true,
            rangeBar: true,
            legend: formatters.legendForSingleSeries
        },
        entities: [
            { id: "meter1", type: "meter", name: "meter1" },
            { id: "meter2", type: "meter", name: "meter2" }
        ],
        rangeEntity: { id: "substation1", type: "substation", name: "**F**substation" },
        rangeCollection: {
            label: 'substation_day',
            name: 'substation_interval_day',
            interval: 86400000,
            series: [
                { label: "Avg", type: 'line', exp: "data.avgConsumptionVah" }
            ]
        },
        collections: [
            {
                label: 'meter_raw',
                name: 'meter_read',
                interval: 3600000,
                series: [
                    { label: "Voltage", type: 'line', exp: "data.voltage", yIndex: 'left' }
                ],
                threshold: { min: 0, max: (1000 * 60 * 60 * 24 * 10) },    //  0 ~ 10 days
                initScales: { left: { min: 245, max: 260 } }
            }, {
                label: 'meter_day',
                name: 'meter_read_day',
                interval: 86400000,
                series: [
                    { label: "Avg Voltage", type: 'line', exp: "data.avgVoltage", yIndex: 'left' }
                ],
                threshold: { min: (1000 * 60 * 60 * 24 * 10), max: (1000 * 60 * 60 * 24 * 7 * 52 * 10) },    // 7 days ~ 3 weeks
                initScales: { left: { min: 245, max: 260 } }
            }
        ]
    },
    dataService: dataService,
    show: false,
    ranges: [
        { name: "7 days", value: 604800000, show: true },
        { name: "1 month", value: 2592000000 }
    ],
    initRange: {
        start: moment().subtract(10, 'days').startOf('day').valueOf(),
        end: moment().add(1, 'days').valueOf()
    },
    timezone: 'Australia/Melbourne'
    // timezone: 'Pacific/Auckland'
};



const graph: FgpGraph = new FgpGraph(graphDiv, [vdConfig, vsConfig]);


const graph2: FgpGraph = new FgpGraph(graphDiv2, [vdConfig, vsConfig]);
