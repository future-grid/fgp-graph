import { DataHandler } from "../services/dataService";

/**
 *
 *
 * @export
 * @interface Features
 */
export interface Features {
    zoom: boolean;
    scroll: boolean;
    rangeBar: boolean;
    connectPoints?: boolean;
    export?: { pic: boolean, data: boolean };
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



export interface GraphSeries {
    label: string;
    color?: string;
    exp: string;
    type: string;
    yIndex?: string;
}

export interface GraphCollection {
    label: string;
    name: string;
    series: Array<GraphSeries>;
    interval: number;
    yLabel?: string;
    y2Label?: string;
    range?: { min: number, max: number }
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

}