export declare class Formatters {
    timezone: string;
    constructor(timezone: string);
    legendForAllSeries: (data: any) => any;
    legendForSingleSeries: (data: any) => any;
    axisLabel: (d: any, granularity: any) => string;
}
