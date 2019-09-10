export declare class GraphInteractions {
    callback: any;
    dateRange?: Array<number>;
    private panEnable;
    private mouseTimer;
    private scrollEnable;
    private scrollTimer;
    private preDatewindow;
    private needRefresh;
    private yAxisRangeChanged;
    constructor(callback: any, dateRange?: Array<number>);
    private pageX;
    private pageY;
    private dragGetX_;
    private dragGetY_;
    private cancelEvent;
    private offsetToPercentage;
    private pan;
    private adjustAxis;
    private zoom;
    mouseUp: (e: any, g: any, context: any) => void;
    mouseDown: (e: any, g: any, context: any) => void;
    mouseMove: (e: any, g: any, context: any) => void;
    mouseOut: (e: any, g: any, context: any) => void;
    mouseScroll: (e: any, g: any, context: any) => void;
    mouseEnter: (e: any, g: any, context: any) => void;
}
