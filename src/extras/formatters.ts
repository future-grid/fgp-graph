import Dygraph from 'dygraphs';
import moment from 'moment-timezone';

export class Formatters {

    /**
     *show graph timestamp with this timezone
     * @type {string}
     * @memberof Formatters
     */
    public timezone: string;

    private TICK_PLACEMENT: any[];
    /**
     *Creates an instance of Formatters.
     * @param {string} timezone  show graph timestamp with this timezone
     * @memberof Formatters
     */
    constructor(timezone: string) {
        this.timezone = timezone;
        const DATEFIELD_Y = 0;
        const DATEFIELD_M = 1;
        const DATEFIELD_D = 2;
        const DATEFIELD_HH = 3;
        const DATEFIELD_MM = 4;
        const DATEFIELD_SS = 5;
        const DATEFIELD_MS = 6;
        const NUM_DATEFIELDS = 7;

        const SECONDLY = 0;
        const TWO_SECONDLY = 1;
        const FIVE_SECONDLY = 2;
        const TEN_SECONDLY = 3;
        const THIRTY_SECONDLY = 4;
        const MINUTELY = 5;
        const TWO_MINUTELY = 6;
        const FIVE_MINUTELY = 7;
        const TEN_MINUTELY = 8;
        const THIRTY_MINUTELY = 9;
        const HOURLY = 10;
        const TWO_HOURLY = 11;
        const SIX_HOURLY = 12;
        const DAILY = 13;
        const TWO_DAILY = 14;
        const WEEKLY = 15;
        const MONTHLY = 16;
        const QUARTERLY = 17;
        const BIANNUAL = 18;
        const ANNUAL = 19;
        const DECADAL = 20;
        const CENTENNIAL = 21;
        const NUM_GRANULARITIES = 22;


        this.TICK_PLACEMENT = [];
        this.TICK_PLACEMENT[SECONDLY] = { datefield: DATEFIELD_SS, step: 1, spacing: 1000 * 1 };
        this.TICK_PLACEMENT[TWO_SECONDLY] = { datefield: DATEFIELD_SS, step: 2, spacing: 1000 * 2 };
        this.TICK_PLACEMENT[FIVE_SECONDLY] = { datefield: DATEFIELD_SS, step: 5, spacing: 1000 * 5 };
        this.TICK_PLACEMENT[TEN_SECONDLY] = { datefield: DATEFIELD_SS, step: 10, spacing: 1000 * 10 };
        this.TICK_PLACEMENT[THIRTY_SECONDLY] = { datefield: DATEFIELD_SS, step: 30, spacing: 1000 * 30 };
        this.TICK_PLACEMENT[MINUTELY] = { datefield: DATEFIELD_MM, step: 1, spacing: 1000 * 60 };
        this.TICK_PLACEMENT[TWO_MINUTELY] = { datefield: DATEFIELD_MM, step: 2, spacing: 1000 * 60 * 2 };
        this.TICK_PLACEMENT[FIVE_MINUTELY] = { datefield: DATEFIELD_MM, step: 5, spacing: 1000 * 60 * 5 };
        this.TICK_PLACEMENT[TEN_MINUTELY] = { datefield: DATEFIELD_MM, step: 10, spacing: 1000 * 60 * 10 };
        this.TICK_PLACEMENT[THIRTY_MINUTELY] = { datefield: DATEFIELD_MM, step: 30, spacing: 1000 * 60 * 30 };
        this.TICK_PLACEMENT[HOURLY] = { datefield: DATEFIELD_HH, step: 1, spacing: 1000 * 3600 };
        this.TICK_PLACEMENT[TWO_HOURLY] = { datefield: DATEFIELD_HH, step: 2, spacing: 1000 * 3600 * 2 };
        this.TICK_PLACEMENT[SIX_HOURLY] = { datefield: DATEFIELD_HH, step: 6, spacing: 1000 * 3600 * 6 };
        this.TICK_PLACEMENT[DAILY] = { datefield: DATEFIELD_D, step: 1, spacing: 1000 * 86400 };
        this.TICK_PLACEMENT[TWO_DAILY] = { datefield: DATEFIELD_D, step: 2, spacing: 1000 * 86400 * 2 };
        this.TICK_PLACEMENT[WEEKLY] = { datefield: DATEFIELD_D, step: 7, spacing: 1000 * 604800 };
        this.TICK_PLACEMENT[MONTHLY] = { datefield: DATEFIELD_M, step: 1, spacing: 1000 * 7200 * 365.2524 }; // 1e3 * 60 * 60 * 24 * 365.2524 / 12
        this.TICK_PLACEMENT[QUARTERLY] = { datefield: DATEFIELD_M, step: 3, spacing: 1000 * 21600 * 365.2524 }; // 1e3 * 60 * 60 * 24 * 365.2524 / 4
        this.TICK_PLACEMENT[BIANNUAL] = { datefield: DATEFIELD_M, step: 6, spacing: 1000 * 43200 * 365.2524 }; // 1e3 * 60 * 60 * 24 * 365.2524 / 2
        this.TICK_PLACEMENT[ANNUAL] = { datefield: DATEFIELD_Y, step: 1, spacing: 1000 * 86400 * 365.2524 }; // 1e3 * 60 * 60 * 24 * 365.2524 * 1
        this.TICK_PLACEMENT[DECADAL] = { datefield: DATEFIELD_Y, step: 10, spacing: 1000 * 864000 * 365.2524 }; // 1e3 * 60 * 60 * 24 * 365.2524 * 10
        this.TICK_PLACEMENT[CENTENNIAL] = { datefield: DATEFIELD_Y, step: 100, spacing: 1000 * 8640000 * 365.2524 }; // 1e3 * 60 * 60 * 24 * 365.2524 * 100
    }




    private numDateTicks = (start_time: number, end_time: number, granularity: number) => {
        const spacing = this.TICK_PLACEMENT[granularity].spacing;
        return Math.round(1.0 * (end_time - start_time) / spacing);
    };


    private pickDateTickGranularity = (a: any, b: any, pixels: any, opts: any) => {
        var pixels_per_tick = opts('pixelsPerLabel');
        for (var i = 0; i < 21; i++) {
            var num_ticks = this.numDateTicks(a, b, i);
            if (pixels / num_ticks >= pixels_per_tick) {
                return i;
            }
        }
        return -1;
    };

    private zeropad = (x: number) => {
        if (x < 10) return "0" + x; else return "" + x;
    };



    private getDateAxis = (start: any, end: any, granularity: any, opts: any, dygraph: Dygraph) => {

        const SECONDLY = 0;
        const TWO_SECONDLY = 1;
        const FIVE_SECONDLY = 2;
        const TEN_SECONDLY = 3;
        const THIRTY_SECONDLY = 4;
        const MINUTELY = 5;
        const TWO_MINUTELY = 6;
        const FIVE_MINUTELY = 7;
        const TEN_MINUTELY = 8;
        const THIRTY_MINUTELY = 9;
        const HOURLY = 10;
        const TWO_HOURLY = 11;
        const SIX_HOURLY = 12;
        const DAILY = 13;
        const TWO_DAILY = 14;
        const WEEKLY = 15;
        const MONTHLY = 16;
        const QUARTERLY = 17;
        const BIANNUAL = 18;
        const ANNUAL = 19;
        const DECADAL = 20;
        const CENTENNIAL = 21;
        const NUM_GRANULARITIES = 22;
        let SHORT_SPACINGS = [];
        SHORT_SPACINGS[SECONDLY] = 1000 * 1;
        SHORT_SPACINGS[TWO_SECONDLY] = 1000 * 2;
        SHORT_SPACINGS[FIVE_SECONDLY] = 1000 * 5;
        SHORT_SPACINGS[TEN_SECONDLY] = 1000 * 10;
        SHORT_SPACINGS[THIRTY_SECONDLY] = 1000 * 30;
        SHORT_SPACINGS[MINUTELY] = 1000 * 60;
        SHORT_SPACINGS[TWO_MINUTELY] = 1000 * 60 * 2;
        SHORT_SPACINGS[FIVE_MINUTELY] = 1000 * 60 * 5;
        SHORT_SPACINGS[TEN_MINUTELY] = 1000 * 60 * 10;
        SHORT_SPACINGS[THIRTY_MINUTELY] = 1000 * 60 * 30;
        SHORT_SPACINGS[HOURLY] = 1000 * 3600;
        SHORT_SPACINGS[TWO_HOURLY] = 1000 * 3600 * 2;
        SHORT_SPACINGS[SIX_HOURLY] = 1000 * 3600 * 6;
        SHORT_SPACINGS[DAILY] = 1000 * 86400;
        SHORT_SPACINGS[WEEKLY] = 1000 * 604800;
        SHORT_SPACINGS[TWO_DAILY] = 1000 * 86400 * 2;

        //
        let formatter = /** @type{AxisLabelFormatter} */(
            opts("axisLabelFormatter"));
        let ticks = [];
        let t;

        console.info("granularity: "+granularity);
        if (granularity < MONTHLY) {
            // Generate one tick mark for every fixed interval of time.
            var spacing = SHORT_SPACINGS[granularity];
            // Find a time less than start_time which occurs on a "nice" time boundary
            // for this granularity.
            var g = spacing / 1000;
            var d = moment(start).tz(this.timezone ? this.timezone : moment.tz.guess());
            d.millisecond(0);
            var x;
            if (g <= 60) {  // seconds
                x = d.second(); d.second(x - x % g);
            } else {
                d.second(0);
                g /= 60;
                if (g <= 60) {  // minutes
                    x = d.minute(); d.minute(x - x % g);
                } else {
                    d.minute(0);
                    g /= 60;

                    if (g <= 24) {  // days
                        x = d.hour(); d.hour(x - x % g);
                    } else {
                        d.hour(0);
                        g /= 24;

                        if (g == 7) {  // one week
                            d.startOf('week');
                        }
                    }
                }
            }
            start = d.valueOf();

            var start_offset_min = moment(start).tz(this.timezone ? this.timezone : moment.tz.guess()).utcOffset();
            var check_dst = (spacing >= SHORT_SPACINGS[14]);
            for (t = start; t <= end; t += spacing) {
                let d = moment(t).tz(this.timezone ? this.timezone : moment.tz.guess());

                if (check_dst && d.utcOffset() != start_offset_min) {
                    var delta_min = d.utcOffset() - start_offset_min;
                    t += delta_min * 60 * 1000;
                    d = moment(t).tz(this.timezone ? this.timezone : moment.tz.guess());
                    start_offset_min = d.utcOffset();

                    // Check whether we've backed into the previous timezone again.
                    // This can happen during a "spring forward" transition. In this case,
                    // it's best to skip this tick altogether (we may be shooting for a
                    // non-existent time like the 2AM that's skipped) and go to the next
                    // one.
                    if (moment(t + spacing).tz(this.timezone ? this.timezone : moment.tz.guess()).utcOffset() != start_offset_min) {
                        t += spacing;
                        d = moment(t).tz(this.timezone ? this.timezone : moment.tz.guess());
                        start_offset_min = d.utcOffset();
                    }
                }

                ticks.push({
                    v: t,
                    label: formatter(d, granularity, opts, dygraph)
                });
            }


        } else {
            // Display a tick mark on the first of a set of months of each year.
            // Years get a tick mark iff y % year_mod == 0. This is useful for
            // displaying a tick mark once every 10 years, say, on long time scales.
            let months: number[] = [];
            let year_mod = 1;  // e.g. to only print one point every 10 years.
            if (granularity == MONTHLY) {
                months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
            } else if (granularity == QUARTERLY) {
                months = [0, 3, 6, 9];
            } else if (granularity == BIANNUAL) {
                months = [0, 6];
            } else if (granularity == ANNUAL) {
                months = [0];
            } else if (granularity == DECADAL) {
                months = [0];
                year_mod = 10;
            } else if (granularity == CENTENNIAL) {
                months = [0];
                year_mod = 100;
            } else {
                console.warn("Span of dates is too long");
            }

            var start_year = moment(start).tz(this.timezone ? this.timezone : moment.tz.guess()).year();
            var end_year = moment(end).tz(this.timezone ? this.timezone : moment.tz.guess()).year();
            for (let i = start_year; i <= end_year; i++) {
                if (i % year_mod !== 0) continue;
                for (let j = 0; j < months.length; j++) {
                    var dt = moment.tz(new Date(i, months[j], 1), this.timezone ? this.timezone : moment.tz.guess()); // moment.tz(Date, tz_String) is NOT the same as moment(Date).tz(String) !!
                    dt.year(i);
                    t = dt.valueOf();
                    if (t < start || t > end) continue;
                    ticks.push({
                        v: t,
                        label: formatter(moment(t).tz(this.timezone ? this.timezone : moment.tz.guess()), granularity, opts, dygraph)
                    });
                }
            }
        }

        return ticks;
    }





    DateTickerTZ = (a: any, b: any, pixels: any, opts: any, dygraph: Dygraph, vals: any) => {

        let granularity = this.pickDateTickGranularity(a, b, pixels, opts);
        if (granularity >= 0) {
            return this.getDateAxis(a, b, granularity, opts, dygraph); // use own own function here
        } else {
            // this can happen if self.width_ is zero.
            return [];
        }
    }




    /**
     * 
     * legend formatter for multiple series
     * @param {any} data  this data comes from graph 
     *
     * @memberof Formatters
     */
    legendForAllSeries = (data: any) => {
        if (data.x == null) {
            // This happens when there's no selection and {legend: 'always'} is set.
            return '<br>' + data.series.map(function (series: any) { return series.dashHTML + ' ' + series.labelHTML }).join('<br>');
        }
        var html = moment.tz(data.x, this.timezone ? this.timezone : moment.tz.guess()).format('lll z');
        data.series.forEach(function (series: any) {
            if (!series.isVisible) return;
            var labeledData = series.labelHTML + ': ' + series.yHTML;
            if (series.isHighlighted) {
                labeledData = '<b style="color:' + series.color + ';">' + labeledData + '</b>';
            }
            html += '<br>' + series.dashHTML + ' ' + labeledData;
        });
        return html;
    }

    /**
     * 
     * legend formatter for single series
     * @param {any} data  this data comes from graph 
     *
     * @memberof Formatters
     */
    legendForSingleSeries = (data: any) => {
        if (data.x == null) {
            // This happens when there's no selection and {legend: 'always'} is set.
            return '<br>' + data.series.map(function (series: any) { return series.dashHTML + ' ' + series.labelHTML }).join('<br>');
        }

        var html = moment.tz(data.x, this.timezone ? this.timezone : moment.tz.guess()).format('lll z');

        data.series.forEach(function (series: any) {
            if (!series.isVisible) return;
            var labeledData = series.labelHTML + ': ' + series.yHTML;
            if (series.isHighlighted) {
                labeledData = '<b style="color:' + series.color + ';">' + labeledData + '</b>';
                html += '<br>' + series.dashHTML + ' ' + labeledData;
            }
        });
        return html;
    }

    /**
     *formatter for axis label 
     * @param {number|date} d 
     * @param {number} granularity
     * @param {function} opts 
     * @param {Dygraph} dygraph 
     * @returns {string} 
     * @memberof Formatters
     */
    axisLabel = (d: number | Date, granularity: number, opts?: (name: string) => any, dygraph?: Dygraph): any => {
        // don't put it into formatters.ts becault we need to timezone later
        let momentDatetime;

        if (d instanceof Date) {
            momentDatetime = moment.tz(d.getTime(), this.timezone ? this.timezone : moment.tz.guess());
        } else {
            momentDatetime = moment.tz(d, this.timezone ? this.timezone : moment.tz.guess());
        }
        let SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let zeropad = (x: number) => {
            if (x < 10) return "0" + x;
            else return "" + x;
        };

        let hmsString_ = (hh: number, mm: number, ss: number) => {
            var ret = zeropad(hh) + ":" + zeropad(mm);
            if (ss) {
                ret += ":" + zeropad(ss);
            }
            return ret;
        };

        if (granularity >= Dygraph.DECADAL) {
            return '' + momentDatetime.year();
        } else if (granularity >= Dygraph.MONTHLY) {
            return SHORT_MONTH_NAMES[momentDatetime.month()] + '&#160;' + momentDatetime.year();
        } else {
            var frac = momentDatetime.hours() * 3600 + momentDatetime.minutes() * 60 + momentDatetime.seconds() + 1e-3 * momentDatetime.milliseconds();
            if (frac === 0 || granularity >= Dygraph.DAILY) {
                // e.g. '21 Jan' (%d%b)
                return zeropad(momentDatetime.date()) + '&#160;' + SHORT_MONTH_NAMES[momentDatetime.month()];
            } else {
                return hmsString_(momentDatetime.hours(), momentDatetime.minutes(), momentDatetime.seconds());
            }
        }
    }

}