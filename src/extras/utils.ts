import {GraphCollection} from "../metadata/configurations";

export default class utils {

    static getContext = (canvas: HTMLCanvasElement) => {
        return canvas.getContext("2d");
    };

    static createCanvas = () => {
        return document.createElement('canvas');
    };

    static findPos = (obj: HTMLElement): { x: number, y: number } => {
        const p = obj.getBoundingClientRect(),
            w = window,
            d = document.documentElement;

        return {
            x: p.left + (w.pageXOffset || d.scrollLeft),
            y: p.top + (w.pageYOffset || d.scrollTop)
        };
    };

    static getContextPixelRatio(context: any): number {
        try {
            let devicePixelRatio = window.devicePixelRatio;
            let backingStoreRatio = context.webkitBackingStorePixelRatio ||
                context.mozBackingStorePixelRatio ||
                context.msBackingStorePixelRatio ||
                context.oBackingStorePixelRatio ||
                context.backingStorePixelRatio || 1;
            if (devicePixelRatio !== undefined) {
                return devicePixelRatio / backingStoreRatio;
            } else {
                // At least devicePixelRatio must be defined for this ratio to make sense.
                // We default backingStoreRatio to 1: this does not exist on some browsers
                // (i.e. desktop Chrome).
                return 1;
            }
        } catch (e) {
            return 1;
        }
    };

    static cancelEvent = (e: any) => {
        e = e ? e : window.event;
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.cancelBubble = true;
        e.cancel = true;
        e.returnValue = false;
        return false;
    };

    static addEvent = (element: Document, type: any, fn: any) => {
        element.addEventListener(type, fn, false);
    };

    static removeEvent = (elem: Document, type: any, fn: any) => {
        elem.removeEventListener(type, fn, false);
    };

    static pageX = (e: MouseEvent) => {
        return (!e.pageX || e.pageX < 0) ? 0 : e.pageX;
    };

    static pageY = (e: MouseEvent) => {
        return (!e.pageY || e.pageY < 0) ? 0 : e.pageX;
    };

    static dragGetX = (e: MouseEvent, context: any) => {
        return utils.pageX(e) - context.px;
    };

    static dragGetY = (e: MouseEvent, context: any) => {
        return utils.pageY(e) - context.px;
    };

    static log10 = (x: number) => {
        return Math.log(x);
    };

    static LOG_SCALE = 10;

    static LN_TEN = Math.log(utils.LOG_SCALE);

    static findBestCollection = (collection: GraphCollection[], dateWindow: [number, number]): GraphCollection | undefined => {

        // find if there is someone locked.
        let chosenCollection = collection.find((value: GraphCollection, index: number, obj: GraphCollection[]) => {
            return !!value.locked;
        });

        if (chosenCollection) {
            return chosenCollection;
        } else {
            chosenCollection = collection.find((value: GraphCollection, index: number, obj: GraphCollection[]) => {
                if (value.threshold) {
                    return (dateWindow[1] - (dateWindow[0] - value.interval)) <= (value.threshold.max);
                }
            });
            return chosenCollection;
        }

    };

}