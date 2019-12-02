import Dygraph from "dygraphs";
import moment from 'moment-timezone';

export class GraphInteractions {


    private panEnable!: boolean;

    private mouseTimer!: number;

    private scrollEnable: boolean;

    private scrollTimer!: number;

    private preDatewindow!: Array<any>;

    private needRefresh!: boolean;

    private yAxisRangeChanged!: boolean;

    private mainGraph!: Dygraph;

    private xBoundary!: [number, number];



    constructor(public callback: any, public dateRange?: Array<number>) {
        this.panEnable = false;
        this.scrollEnable = false;
    }

    private LOG_SCALE = 10;
    private LN_TEN = Math.log(this.LOG_SCALE);


    private log10 = (x: number) => {
        return Math.log(x) / this.LN_TEN;
    };

    private pageX = (e: MouseEvent) => {
        return !e.pageX || e.pageX < 0 ? 0 : e.pageX;
    }

    private pageY = (e: MouseEvent) => {
        return !e.pageY || e.pageY < 0 ? 0 : e.pageY;
    }

    private dragGetX_ = (e: MouseEvent, context: any) => {
        return this.pageX(e) - context.px;
    }

    private dragGetY_ = (e: MouseEvent, context: any) => {
        return this.pageY(e) - context.py;
    }

    private cancelEvent = (e: any) => {
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
    }

    private endPan = (event: MouseEvent, g: any, context: any) => {
        context.dragEndX = this.dragGetX_(event, context);
        context.dragEndY = this.dragGetY_(event, context);
        var regionWidth = Math.abs(context.dragEndX - context.dragStartX);
        var regionHeight = Math.abs(context.dragEndY - context.dragStartY);

        if (regionWidth < 2 && regionHeight < 2 &&
            g.lastx_ !== undefined && g.lastx_ != -1) {
            this.treatMouseOpAsClick(g, event, context);
        }

        context.regionWidth = regionWidth;
        context.regionHeight = regionHeight;
    }

    private startPan = (event: MouseEvent, g: any, context: any) => {
        var i, axis;
        context.isPanning = true;
        var xRange = g.xAxisRange();

        if (g.getOptionForAxis("logscale", "x")) {
            context.initialLeftmostDate = this.log10(xRange[0]);
            context.dateRange = this.log10(xRange[1]) - this.log10(xRange[0]);
        } else {
            context.initialLeftmostDate = xRange[0];
            context.dateRange = xRange[1] - xRange[0];
        }
        context.xUnitsPerPixel = context.dateRange / (g.plotter_.area.w - 1);

        if (g.getNumericOption("panEdgeFraction")) {
            var maxXPixelsToDraw = g.width_ * g.getNumericOption("panEdgeFraction");
            var xExtremes = g.xAxisExtremes(); // I REALLY WANT TO CALL THIS xTremes!

            var boundedLeftX = g.toDomXCoord(xExtremes[0]) - maxXPixelsToDraw;
            var boundedRightX = g.toDomXCoord(xExtremes[1]) + maxXPixelsToDraw;

            var boundedLeftDate = g.toDataXCoord(boundedLeftX);
            var boundedRightDate = g.toDataXCoord(boundedRightX);
            context.boundedDates = [boundedLeftDate, boundedRightDate];

            var boundedValues = [];
            var maxYPixelsToDraw = g.height_ * g.getNumericOption("panEdgeFraction");

            for (i = 0; i < g.axes_.length; i++) {
                axis = g.axes_[i];
                var yExtremes = axis.extremeRange;

                var boundedTopY = g.toDomYCoord(yExtremes[0], i) + maxYPixelsToDraw;
                var boundedBottomY = g.toDomYCoord(yExtremes[1], i) - maxYPixelsToDraw;

                var boundedTopValue = g.toDataYCoord(boundedTopY, i);
                var boundedBottomValue = g.toDataYCoord(boundedBottomY, i);

                boundedValues[i] = [boundedTopValue, boundedBottomValue];
            }
            context.boundedValues = boundedValues;
        }

        // Record the range of each y-axis at the start of the drag.
        // If any axis has a valueRange, then we want a 2D pan.
        // We can't store data directly in g.axes_, because it does not belong to us
        // and could change out from under us during a pan (say if there's a data
        // update).
        context.is2DPan = false;
        context.axes = [];
        for (i = 0; i < g.axes_.length; i++) {
            axis = g.axes_[i];
            var axis_data = { initialTopValue: 0, dragValueRange: 0, unitsPerPixel: 0 };
            var yRange = g.yAxisRange(i);
            // TODO(konigsberg): These values should be in |context|.
            // In log scale, initialTopValue, dragValueRange and unitsPerPixel are log scale.
            var logscale = g.attributes_.getForAxis("logscale", i);
            if (logscale) {
                axis_data.initialTopValue = this.log10(yRange[1]);
                axis_data.dragValueRange = this.log10(yRange[1]) - this.log10(yRange[0]);
            } else {
                axis_data.initialTopValue = yRange[1];
                axis_data.dragValueRange = yRange[1] - yRange[0];
            }
            axis_data.unitsPerPixel = axis_data.dragValueRange / (g.plotter_.area.h - 1);
            context.axes.push(axis_data);

            // While calculating axes, set 2dpan.
            if (axis.valueRange) context.is2DPan = true;
        }
    }


    private treatMouseOpAsClick = (g: any, event: MouseEvent, context: any) => {
        var clickCallback = g.getFunctionOption('clickCallback');
        var pointClickCallback = g.getFunctionOption('pointClickCallback');

        var selectedPoint = null;

        // Find out if the click occurs on a point.
        var closestIdx = -1;
        var closestDistance = Number.MAX_VALUE;

        // check if the click was on a particular point.
        for (var i = 0; i < g.selPoints_.length; i++) {
            var p = g.selPoints_[i];
            var distance = Math.pow(p.canvasx - context.dragEndX, 2) +
                Math.pow(p.canvasy - context.dragEndY, 2);
            if (!isNaN(distance) &&
                (closestIdx == -1 || distance < closestDistance)) {
                closestDistance = distance;
                closestIdx = i;
            }
        }

        // Allow any click within two pixels of the dot.
        var radius = g.getNumericOption('highlightCircleSize') + 2;
        if (closestDistance <= radius * radius) {
            selectedPoint = g.selPoints_[closestIdx];
        }

        if (selectedPoint) {
            var e: any = {
                cancelable: true,
                point: selectedPoint,
                canvasx: context.dragEndX,
                canvasy: context.dragEndY
            };
            var defaultPrevented = g.cascadeEvents_('pointClick', e);
            if (defaultPrevented) {
                // Note: this also prevents click / clickCallback from firing.
                return;
            }
            if (pointClickCallback) {
                pointClickCallback.call(g, event, selectedPoint);
            }
        }

        var e: any = {
            cancelable: true,
            xval: g.lastx_,  // closest point by x value
            pts: g.selPoints_,
            canvasx: context.dragEndX,
            canvasy: context.dragEndY
        };
        if (!g.cascadeEvents_('click', e)) {
            if (clickCallback) {
                // TODO(danvk): pass along more info about the points, e.g. 'x'
                clickCallback.call(g, event, g.lastx_, g.selPoints_);
            }
        }
    }


    private offsetToPercentage = (g: any, offsetX: number, offsetY: number) => {
        // This is calculating the pixel offset of the leftmost date.
        var xOffset = g.toDomCoords(g.xAxisRange()[0], null)[0];
        var yar0 = g.yAxisRange(0);

        // This is calculating the pixel of the higest value. (Top pixel)
        var yOffset = g.toDomCoords(null, yar0[1])[1];

        // x y w and h are relative to the corner of the drawing area,
        // so that the upper corner of the drawing area is (0, 0).
        var x = offsetX - xOffset;
        var y = offsetY - yOffset;

        // This is computing the rightmost pixel, effectively defining the
        // width.
        var w = g.toDomCoords(g.xAxisRange()[1], null)[0] - xOffset;

        // This is computing the lowest pixel, effectively defining the height.
        var h = g.toDomCoords(null, yar0[0])[1] - yOffset;

        // Percentage from the left.
        var xPct = w == 0 ? 0 : (x / w);
        // Percentage from the top.
        var yPct = h == 0 ? 0 : (y / h);

        // The (1-) part below changes it from "% distance down from the top"
        // to "% distance up from the bottom".
        return [xPct, (1 - yPct)];
    }

    private pan = (event: MouseEvent, g: any, context: any, side: string) => {
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

        // y-axis scaling is automatic unless this is a full 2D pan.
        if (context.is2DPan) {
            var pixelsDragged = context.dragEndY - context.dragStartY;
            // Adjust each axis appropriately.
            if (side && ("r" == side || "l" == side)) {
                var index = (side == 'l' ? 0 : 1);
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
                    axis.valueWindow = [Math.pow(10, minValue), Math.pow(10, maxValue)];
                    axis.extremeRange = [Math.pow(10, minValue), Math.pow(10, maxValue)];
                } else {
                    axis.valueRange = [minValue, maxValue];
                    axis.valueWindow = [minValue, maxValue];
                    axis.extremeRange = [minValue, maxValue];
                }
                g.drawGraph_(true);
            } else {
                //
                var zoomRange = this.dateRange;
                if (zoomRange && (minDate < zoomRange[0] || maxDate > zoomRange[1])) {
                    // console.info("return~~~~", new Date(minDate), new Date(zoomRange[0]), new Date(maxDate), new Date(zoomRange[1]));
                    return;
                }
                if (g.getOptionForAxis("logscale", "x")) {
                    g.dateWindow_ = [new Date(Math.pow(10, minDate)), new Date(Math.pow(10, maxDate))];
                } else {
                    g.dateWindow_ = [new Date(minDate), new Date(maxDate)];
                }
                g.drawGraph_(false);
            }
        }
        
    }

    private adjustAxis = (axis: any, zoomInPercentage: number, bias: any) => {
        var delta = axis[1] - axis[0];
        var increment = delta * zoomInPercentage;
        var foo = [increment * bias, increment * (1 - bias)];
        return [axis[0] + foo[0], axis[1] - foo[1]];
    }

    private zoom = (g: any, zoomInPercentage: number, xBias: any, yBias: any, direction: string, side: string, e?: Event) => {

        xBias = xBias || 0.5;
        yBias = yBias || 0.5;
        var yAxes = g.axes_;
        var newYAxes = [];
        for (var i = 0; i < g.numAxes(); i++) {
            newYAxes[i] = this.adjustAxis(yAxes[i].valueRange, zoomInPercentage, yBias);
        }

        if ('v' == direction) {
            if ('l' == side) {
                yAxes[0]['valueRange'] = newYAxes[0];
                yAxes[0]['valueWindow'] = newYAxes[0];
                yAxes[0]['extremeRange'] = newYAxes[0];
            } else if ('r' == side && g.numAxes() == 2) {
                yAxes[1]['valueRange'] = newYAxes[1];
                yAxes[1]['valueWindow'] = newYAxes[1];
                yAxes[1]['extremeRange'] = newYAxes[0];
            }
            g.drawGraph_(false);
        } else {
            if (this.scrollTimer) {
                window.clearTimeout(this.scrollTimer);
            }
            var ranges = g.dateWindow_;
            if (ranges[0] instanceof Date) {
                ranges[0] = ranges[0].getTime();
                ranges[1] = ranges[1].getTime();
            }

            var newZoomRange = this.adjustAxis(ranges, zoomInPercentage, xBias);
            // do not bigger than range data
            var zoomRange = this.dateRange;
            this.scrollTimer = window.setTimeout(() => {
                this.callback(e, g.yAxisRanges(), true);
            }, 500);
            if (zoomRange && (newZoomRange[0] < zoomRange[0] && newZoomRange[1] > zoomRange[1])) {
                return;
            } else if (newZoomRange[0] >= newZoomRange[1]) {
                return;
            } else if (zoomRange && (newZoomRange[0] <= zoomRange[0] && newZoomRange[1] < zoomRange[1])) {
                g.updateOptions({
                    dateWindow: [zoomRange[0], newZoomRange[1]]
                });
            } else if (zoomRange && (newZoomRange[0] > zoomRange[0] && newZoomRange[1] >= zoomRange[1])) {
                g.updateOptions({
                    dateWindow: [newZoomRange[0], zoomRange[1]]
                });
            } else {
                g.updateOptions({
                    dateWindow: [newZoomRange[0], newZoomRange[1]]
                });
            }
        }
    }





    public mouseUp = (e: MouseEvent, g: any, context: any) => {
        // console.debug("mouse up");
        let currentDatewindow = g.dateWindow_;
        if (currentDatewindow[0] instanceof Date) {
            currentDatewindow[0] = currentDatewindow[0].getTime();
            currentDatewindow[1] = currentDatewindow[1].getTime();
        }

        context.isPanning = false;
        // Dygraph.endPan(event, g, context);
        this.endPan(e, g, context);
        // call upadte this.panEnable = false;
        if (this.panEnable && this.needRefresh && (this.preDatewindow[0] != currentDatewindow[0] || this.preDatewindow[1] != currentDatewindow[1])) {
            this.callback(e, g.yAxisRanges(), true);
            this.panEnable = false;
        } else if (this.yAxisRangeChanged) {
            this.callback(e, g.yAxisRanges(), false);
            this.panEnable = false;
        }
    }

    public mouseDown = (e: MouseEvent, g: any, context: any) => {
        this.preDatewindow = g.dateWindow_;
        if (this.preDatewindow[0] instanceof Date) {
            this.preDatewindow[0] = this.preDatewindow[0].getTime();
            this.preDatewindow[1] = this.preDatewindow[1].getTime();
        }

        this.panEnable = true;
        context.initializeMouseDown(event, g, context);
        this.startPan(e, g, context);
        // console.debug("mouse down", context);
    }

    public mouseMove = (e: MouseEvent, g: any, context: any) => {
        if (this.panEnable && context.isPanning) {
            if (e.offsetX <= (g.plotter_.area.x)) {
                this.needRefresh = false;
                this.yAxisRangeChanged = true;
                this.pan(e, g, context, 'l');
            } else if (e.offsetX >= (g.plotter_.area.x + g.plotter_.area.w)) {
                this.needRefresh = false;
                this.yAxisRangeChanged = true;
                this.pan(e, g, context, 'r');
            } else {
                this.needRefresh = true;
                this.pan(e, g, context, 'h');
            }
        }
    }

    public mouseOut = (e: MouseEvent, g: any, context: any) => {
        // console.debug("mouse out");
        if (this.mouseTimer) {
            window.clearTimeout(this.mouseTimer);
        }
        this.scrollEnable = false;

    }

    public mouseScroll = (e: any, g: any, context: any) => {
        if (this.scrollEnable) {
            //
            var normal;

            if (e instanceof WheelEvent) {
                normal = e.detail ? e.detail * -1 : e.deltaY / 40;
            } else {
                normal = e.detail ? e.detail * -1 : e.wheelDelta / 40;
            }

            // For me the normalized value shows 0.075 for one click. If I took
            // that verbatim, it would be a 7.5%.
            var percentage = normal / 50;

            if (!(e.offsetX && e.offsetY)) {
                e.offsetX = e.layerX - e.target.offsetLeft;
                e.offsetY = e.layerY - e.target.offsetTop;
            }
            var percentages = this.offsetToPercentage(g, e.offsetX, e.offsetY);
            var xPct = percentages[0];
            var yPct = percentages[1];
            //
            if (e.offsetX <= (g.plotter_.area.x)) {
                // left zoom
                this.zoom(g, percentage, xPct, yPct, 'v', 'l');
            } else if (e.offsetX >= (g.plotter_.area.x + g.plotter_.area.w)) {
                // right zoom
                this.zoom(g, percentage, xPct, yPct, 'v', 'r');
            } else {
                // middle zoom
                this.zoom(g, percentage, xPct, yPct, 'h', 'm');
            }
            this.cancelEvent(e);
        }
    }

    public mouseEnter = (e: MouseEvent, g: any, context: any) => {

        if (this.mouseTimer) {
            window.clearTimeout(this.mouseTimer);
        }
        this.mouseTimer = window.setTimeout(() => {
            this.scrollEnable = true;
            // console.debug("enable scroll zooming~");
        }, 1000);
    }
}

