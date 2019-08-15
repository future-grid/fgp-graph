import Dygraph from 'dygraphs';
import moment from 'moment-timezone';

export class Formatters {

    constructor(public timezone: string) {

    }


    legendForAllSeries = (data) => {
        if (data.x == null) {
            // This happens when there's no selection and {legend: 'always'} is set.
            return '<br>' + data.series.map(function (series) { return series.dashHTML + ' ' + series.labelHTML }).join('<br>');
        }
        var html = moment.tz(data.x, this.timezone ? this.timezone : moment.tz.guess()).format('lll z');
        data.series.forEach(function (series) {
            if (!series.isVisible) return;
            var labeledData = series.labelHTML + ': ' + series.yHTML;
            if (series.isHighlighted) {
                labeledData = '<b style="color:' + series.color + ';">' + labeledData + '</b>';
            }
            html += '<br>' + series.dashHTML + ' ' + labeledData;
        });
        return html;
    }


    legendForSingleSeries = (data) => {
        if (data.x == null) {
            // This happens when there's no selection and {legend: 'always'} is set.
            return '<br>' + data.series.map(function (series) { return series.dashHTML + ' ' + series.labelHTML }).join('<br>');
        }

        var html = moment.tz(data.x, this.timezone ? this.timezone : moment.tz.guess()).format('lll z');

        data.series.forEach(function (series) {
            if (!series.isVisible) return;
            var labeledData = series.labelHTML + ': ' + series.yHTML;
            if (series.isHighlighted) {
                labeledData = '<b style="color:' + series.color + ';">' + labeledData + '</b>';
                html += '<br>' + series.dashHTML + ' ' + labeledData;
            }
        });
        return html;
    }

    axisLabel = (d, granularity) => {
        // don't put it into formatters.ts becault we need to timezone later
        let momentDatetime = moment.tz(d.getTime(), this.timezone ? this.timezone : moment.tz.guess());
        let SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let zeropad = (x) => {
            if (x < 10) return "0" + x;
            else return "" + x;
        };

        let hmsString_ = (hh, mm, ss) => {
            var ret = zeropad(hh) + ":" + zeropad(mm);
            if (ss) {
                ret += ":" + zeropad(ss);
            }
            return ret;
        };

        if (granularity >= Dygraph.DECADAL) {
            return '' + momentDatetime.year();
        } else if (granularity >= Dygraph.MONTHLY) {
            return SHORT_MONTH_NAMES[momentDatetime.month() + 1] + '&#160;' + momentDatetime.year();
        } else {
            var frac = momentDatetime.hours() * 3600 + momentDatetime.minutes() * 60 + momentDatetime.seconds() + 1e-3 * momentDatetime.milliseconds();
            if (frac === 0 || granularity >= Dygraph.DAILY) {
                // e.g. '21 Jan' (%d%b)
                return zeropad(momentDatetime.date()) + '&#160;' + SHORT_MONTH_NAMES[momentDatetime.month() + 1];
            } else {
                return hmsString_(momentDatetime.hours(), momentDatetime.minutes(), momentDatetime.seconds());
            }
        }
    }

}