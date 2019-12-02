import Dygraph from 'dygraphs';

export class Synchronizer {

    args: Array<any>;
    graphs: Array<Dygraph>;

    constructor(graphs: any[]) {
        this.graphs = graphs;
        this.args = graphs.concat([{
            zoom: true,
            selection: false
        }]);
    }

    synchronize = () => {
        if (this.args.length === 0) {
            throw 'Invalid invocation of Dygraph.synchronize(). Need >= 1 argument.';
        }

        var OPTIONS = ['selection', 'zoom', 'range'];
        var opts: any = {
            selection: true,
            zoom: true,
            range: false
        };
        var dygraphs: any[] = [];
        var prevCallbacks: any[] = [];

        var parseOpts = function (obj: any) {
            if (!(obj instanceof Object)) {
                throw 'Last argument must be either Dygraph or Object.';
            } else {
                for (var i = 0; i < OPTIONS.length; i++) {
                    var optName = OPTIONS[i];
                    if (obj.hasOwnProperty(optName)) opts[optName] = obj[optName];
                }
            }
        };

        var arraysAreEqual = (a: any, b: any) => {
            if (!Array.isArray(a) || !Array.isArray(b)) return false;
            var i = a.length;
            if (i !== b.length) return false;
            while (i--) {
                if (a[i] !== b[i]) return false;
            }
            return true;
        }

        var attachZoomHandlers = (gs: Dygraph[], syncOpts: any, prevCallbacks: any) => {
            var block = false;
            for (var i = 0; i < gs.length; i++) {
                var g = gs[i];
                g.updateOptions({
                    drawCallback: function (me: Dygraph, initial: boolean) {
                        if (block || initial) return;
                        block = true;
                        var opts: { dateWindow: any, valueRange?: any } = {
                            dateWindow: me.xAxisRange()
                        };
                        if (syncOpts.range) opts.valueRange = me.yAxisRange();

                        for (var j = 0; j < gs.length; j++) {
                            if (gs[j] == me) {
                                if (prevCallbacks[j] && prevCallbacks[j].drawCallback) {
                                    prevCallbacks[j].drawCallback.apply(this, arguments);
                                }
                                continue;
                            }

                            // Only redraw if there are new options
                            if (arraysAreEqual(opts.dateWindow, gs[j].getOption('dateWindow')) &&
                                arraysAreEqual(opts.valueRange, gs[j].getOption('valueRange'))) {
                                continue;
                            }

                            gs[j].updateOptions(opts);
                        }
                        block = false;
                    }
                }, true /* no need to redraw */);
            }
        }

        var attachSelectionHandlers = (gs: any[], prevCallbacks: any) => {
            var block = false;
            for (var i = 0; i < gs.length; i++) {
                var g = gs[i];

                g.updateOptions({
                    highlightCallback: function (event: Event, x: any, points: any[], row: any, seriesName: any) {
                        if (block) return;
                        block = true;
                        var me: any = this;
                        for (var i = 0; i < gs.length; i++) {
                            if (me == gs[i]) {
                                if (prevCallbacks[i] && prevCallbacks[i].highlightCallback) {
                                    prevCallbacks[i].highlightCallback.apply(this, arguments);
                                }
                                continue;
                            }
                            var idx = gs[i].getRowForX(x);
                            if (idx !== null) {
                                gs[i].setSelection(idx, seriesName);
                            }
                        }
                        block = false;
                    },
                    unhighlightCallback: function (e: Event) {
                        if (block) return;
                        block = true;
                        var me = this;
                        for (var i = 0; i < gs.length; i++) {
                            if (me == gs[i]) {
                                if (prevCallbacks[i] && prevCallbacks[i].unhighlightCallback) {
                                    prevCallbacks[i].unhighlightCallback.apply(this, arguments);
                                }
                                continue;
                            }
                            gs[i].clearSelection();
                        }
                        block = false;
                    }
                }, true /* no need to redraw */);
            }
        }


        if (this.args[0] instanceof Dygraph) {
            // Arguments are Dygraph objects.
            for (var i = 0; i < this.args.length; i++) {
                if (this.args[i] instanceof Dygraph) {
                    dygraphs.push(this.args[i]);
                } else {
                    break;
                }
            }
            if (i < this.args.length - 1) {
                throw 'Invalid invocation of Dygraph.synchronize(). ' +
                'All but the last argument must be Dygraph objects.';
            } else if (i == this.args.length - 1) {
                parseOpts(this.args[this.args.length - 1]);
            }
        } else if (this.args[0].length) {
            // Invoked w/ list of dygraphs, options
            for (var i = 0; i < this.args[0].length; i++) {
                dygraphs.push(this.args[0][i]);
            }
            if (this.args.length == 2) {
                parseOpts(this.args[1]);
            } else if (this.args.length > 2) {
                throw 'Invalid invocation of Dygraph.synchronize(). ' +
                'Expected two arguments: array and optional options argument.';
            }  // otherwise arguments.length == 1, which is fine.
        } else {
            throw 'Invalid invocation of Dygraph.synchronize(). ' +
            'First parameter must be either Dygraph or list of Dygraphs.';
        }

        if (dygraphs.length < 2) {
            throw 'Invalid invocation of Dygraph.synchronize(). ' +
            'Need two or more dygraphs to synchronize.';
        }

        var readycount = dygraphs.length;
        for (var i = 0; i < dygraphs.length; i++) {
            var g = dygraphs[i];
            g.ready(function () {
                if (--readycount == 0) {
                    // store original callbacks
                    var callBackTypes = ['drawCallback', 'highlightCallback', 'unhighlightCallback'];
                    for (var j = 0; j < dygraphs.length; j++) {
                        if (!prevCallbacks[j]) {
                            prevCallbacks[j] = {};
                        }
                        for (var k = callBackTypes.length - 1; k >= 0; k--) {
                            prevCallbacks[j][callBackTypes[k]] = dygraphs[j].getFunctionOption(callBackTypes[k]);
                        }
                    }

                    // Listen for draw, highlight, unhighlight callbacks.
                    if (opts.zoom) {
                        attachZoomHandlers(dygraphs, opts, prevCallbacks);
                    }

                    if (opts.selection) {
                        attachSelectionHandlers(dygraphs, prevCallbacks);
                    }
                }
            });
        }

        return {
            detach: function () {
                for (var i = 0; i < dygraphs.length; i++) {
                    var g = dygraphs[i];
                    if (opts.zoom) {
                        g.updateOptions({ drawCallback: prevCallbacks[i].drawCallback });
                    }
                    if (opts.selection) {
                        g.updateOptions({
                            highlightCallback: prevCallbacks[i].highlightCallback,
                            unhighlightCallback: prevCallbacks[i].unhighlightCallback
                        });
                    }
                }
                // release references & make subsequent calls throw.
                dygraphs = [];
                opts = null;
                prevCallbacks = [];
            },
            graphs: [this.graphs]
        };
    };
}