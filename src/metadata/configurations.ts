import { DataHandler } from "../services/dataService";


/**
 *2 types of exporting graph data and save as image 
 *
 * @export
 * @enum {number}
 */
export enum GraphExports {
    Image = "image",
    Data = "data"
}

/**
 *enable or disable graph features
 *
 * @export
 * @interface Features
 */
export interface Features {
    zoom: boolean;
    scroll: boolean;
    rangeBar: boolean;
    connectPoints?: boolean;
    legend?: any;
    exports?: GraphExports[]; // png
    ctrlButtons?: { x?: boolean, y?: boolean, y2?: boolean }
}

/**
 * device entity
 *
 * @export
 * @interface Entity
 */
export interface Entity {
    id: string;
    type: string;
    name: string;
    description?: string;
    extension?: any;
}

/**
 * div dom element
 *
 * @export
 * @interface DomAttrs
 */
export interface DomAttrs {
    key: string;
    value: string;
}


/**
 *graph series configuration
 *
 * @export
 * @interface GraphSeries
 */
export interface GraphSeries {
    label: string;
    color?: string | undefined;
    exp: string;
    type: string;
    yIndex?: string;
    visibility?: boolean;  // only worked in single device view
}

/**
 *graph collection
 *
 * @export
 * @interface GraphCollection
 */
export interface GraphCollection {
    label: string;
    name: string;
    series: Array<GraphSeries>;
    interval: number;
    yLabel?: string;
    y2Label?: string;
    threshold?: { min: number, max: number };
    initScales?: { left?: { min: number, max: number }, right?: { min: number, max: number } };
    fill?: boolean;
}

export enum FilterType {
    HIGHLIGHT = "highlight",
    COLORS = "color"
}
export type filterFunc = (labels?: Array<string>) => Array<string>;
export interface FilterConfig {
    label: string;
    func: filterFunc;
    type?: FilterType;
}

/**
 * graph configuration
 *
 * @export
 * @interface GraphConfig
 */
export interface GraphConfig {
    features: Features;
    entities: Array<Entity>;
    rangeEntity: Entity;
    collections: Array<GraphCollection>;
    rangeCollection: GraphCollection;
    filters?: { "buttons"?: Array<FilterConfig>, "dropdown"?: Array<FilterConfig> };
}



/**
 *graph callback configuraiton
 *
 * @export
 * @interface Callbacks
 */
export interface Callbacks {
    dataCallback?(data: any): void;
    highlightCallback?(datetime: any, series: any, points: any[]): void;
    clickCallback?(series: string): void;
    syncDateWindow?(dateWindow: number[]): void;
}

/**
 * View config
 *
 * @export
 * @interface ViewConfig
 */
export interface ViewConfig {
    name: string;
    graphConfig: GraphConfig;
    dataService: DataHandler;
    show: boolean;
    ranges?: Array<{ name: string, value: number, show?: boolean }>;
    timezone?: string;
    initRange?: { start: number, end: number };
    interaction?: { callback?: Callbacks };
    connectSeparatedPoints?: boolean;
    highlightSeriesBackgroundAlpha?: number;
}

/**
 * datetime ranges index
 *
 * @export
 * @enum {number}
 */
export enum GraphConstant {
    SECONDLY = 0,
    TWO_SECONDLY = 1,
    FIVE_SECONDLY = 2,
    TEN_SECONDLY = 3,
    THIRTY_SECONDLY = 4,
    MINUTELY = 5,
    TWO_MINUTELY = 6,
    FIVE_MINUTELY = 7,
    TEN_MINUTELY = 8,
    THIRTY_MINUTELY = 9,
    HOURLY = 10,
    TWO_HOURLY = 11,
    SIX_HOURLY = 12,
    DAILY = 13,
    TWO_DAILY = 14,
    WEEKLY = 15,
    MONTHLY = 16,
    QUARTERLY = 17,
    BIANNUAL = 18,
    ANNUAL = 19,
    DECADAL = 20,
    CENTENNIAL = 21,
    NUM_GRANULARITIES = 22
}