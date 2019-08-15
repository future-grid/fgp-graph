import Dygraph from 'dygraphs';
import { ViewConfig, DomAttrs } from '../metadata/configurations';
export declare class DropdownButton {
    private select;
    private btns;
    constructor(select: HTMLSelectElement, buttons: Array<{
        id: string;
        label: string;
        selected?: boolean;
        formatter?: any;
    }>);
    /**
     * generate options
     *
     * @memberof DropdownButton
     */
    render: () => void;
}
export declare class DropdownMenu {
    private dropdown;
    private opts;
    private callback;
    constructor(dropdownArea: HTMLElement, opts: Array<{
        checked: boolean;
        name: string;
        label: string;
    }>, callback: any);
    render: () => void;
}
export declare class SelectWithCheckbox {
    private select;
    private opts;
    constructor(select: HTMLSelectElement, opts: Array<{
        checked: boolean;
        name: string;
        label: string;
    }>);
    render: () => void;
}
export declare class DomElementOperator {
    static createElement: (type: string, attrs: DomAttrs[]) => HTMLElement;
}
export declare class GraphOperator {
    static FIELD_PATTERN: RegExp;
    defaultGraphRanges: Array<{
        name: string;
        value: number;
        show?: boolean;
    }>;
    createElement: (type: string, attrs: DomAttrs[]) => HTMLElement;
    private mainGraph;
    private ragnebarGraph;
    private currentView;
    private currentCollection;
    private rangeCollection;
    private start;
    private end;
    datewindowCallback: any;
    private graphContainer;
    private graphBody;
    private intervalsDropdown;
    private header;
    private yAxisRanges;
    constructor(mainGraph: Dygraph, rangeGraph: Dygraph, graphContainer: HTMLElement, graphBody: HTMLElement, intervalsDropdown: HTMLElement, header: HTMLElement, datewindowCallback: any);
    /**
     * update labels
     *
     * @private
     * @memberof GraphOperator
     */
    private updateCollectionLabels;
    private updateSeriesDropdown;
    init: (view: ViewConfig, readyCallback?: any, interactionCallback?: any) => void;
    refresh: () => void;
    update: (first?: number, last?: number) => void;
}
