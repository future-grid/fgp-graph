import Dygraph from 'dygraphs';


export class GraphInteractions {


    private panEnable: boolean;

    constructor(public callback: any) {
        this.panEnable = false;
    }

    private pageX = (e) => {
        return !e.pageX || e.pageX < 0 ? 0 : e.pageX;
    }

    private pageY = (e) => {
        return !e.pageY || e.pageY < 0 ? 0 : e.pageY;
    }

    private dragGetX_ = (e, context) => {
        return this.pageX(e) - context.px;
    }

    private dragGetY_ = (e, context) => {
        return this.pageY(e) - context.py;
    }

    private pan = (event, g, context, side) => {
        context.dragEndX = this.dragGetX_(event, context);
        context.dragEndY = this.dragGetY_(event, context);

        var minDate = context.initialLeftmostDate - (context.dragEndX - context.dragStartX) * context.xUnitsPerPixel;
        if (context.boundedDates) {
            minDate = Math.max(minDate, context.boundedDates[0]);
        }
        var maxDate = minDate + context.dateRange;
        if (context.boundedDates) {
            if (maxDate > context.boundedDates[1]) {
                // Adjust minDate, and recompute maxDate.
                minDate = minDate - (maxDate - context.boundedDates[1]);
                maxDate = minDate + context.dateRange;
            }
        }

        if (g.getOptionForAxis("logscale", "x")) {
            g.dateWindow_ = [Math.pow(10, minDate), Math.pow(10, maxDate)];
        } else {
            g.dateWindow_ = [minDate, maxDate];
        }

        // y-axis scaling is automatic unless this is a full 2D pan.
        if (context.is2DPan) {
            var pixelsDragged = context.dragEndY - context.dragStartY;
            // Adjust each axis appropriately.
            if (side && ("r" == side || "l" == side)) {
                var index = (side == 'l' ? 1 : 0);
                var axis = g.axes_[index];
                var axis_data = context.axes[index];
                var unitsDragged = pixelsDragged * axis_data.unitsPerPixel;
                var boundedValue = context.boundedValues ? context.boundedValues[index] : null;
                // In log scale, maxValue and minValue are the logs of those values.
                var maxValue = axis_data.initialTopValue + unitsDragged;
                if (boundedValue) {
                    maxValue = Math.min(maxValue, boundedValue[index]);
                }
                var minValue = maxValue - axis_data.dragValueRange;
                if (boundedValue) {
                    if (minValue < boundedValue[0]) {
                        // Adjust maxValue, and recompute minValue.
                        maxValue = maxValue - (minValue - boundedValue[0]);
                        minValue = maxValue - axis_data.dragValueRange;
                    }
                }
                if (g.attributes_.getForAxis("logscale", index)) {
                    axis.valueRange = [Math.pow(10, minValue), Math.pow(10, maxValue)];
                } else {
                    axis.valueRange = [minValue, maxValue];
                }
            }
        }

        g.drawGraph_(false);
    }



    public mouseUp = (e, g, context) => {
        console.debug("mouse up");
        // call upadte this.panEnable = false;
        if (this.panEnable) {
            context.isPanning = false;
            Dygraph.endPan(event, g, context);
            this.callback(e, g.yAxisRanges());
            this.panEnable = false;
        }
    }

    public mouseDown = (e, g, context) => {
        // after hold the mouse down for more than a second!
        this.panEnable = true;
        context.initializeMouseDown(event, g, context);
        Dygraph.startPan(event, g, context);
        console.debug("mouse down", context);
    }

    public mouseMove = (e, g, context) => {
        if (this.panEnable && context.isPanning) {
            if (e.offsetX <= (g.plotter_.area.x)) {
                this.pan(e, g, context, 'r');
            } else if (e.offsetX >= (g.plotter_.area.x + g.plotter_.area.w)) {
                this.pan(e, g, context, 'l');
            } else {
                this.pan(e, g, context, 'h');
            }
        }
    }

    public mouseOut = (e, g, context) => {
        console.debug("mouse out");
        // this.callback();
    }

    public mouseScroll = (e, g, context) => {
        console.debug("mouse scroll");
    }


}