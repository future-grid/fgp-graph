export interface DataHandler {
    source: string;
    /**
     * fetch data for multi-devices
     *
     * @param {Array<string>} ids
     * @param {{ start: number; end: number }} range
     * @param {Array<string>} [fields]
     * @returns {Array<{ id: string, data: Array<any> }>}
     * @memberof DataHandler
     */
    fetchdata(ids: Array<string>, interval: string, range: {
        start: number;
        end: number;
    }, fields?: Array<string>): Promise<Array<{
        id: string;
        data: Array<any>;
    }>>;
    fetchFirstNLast(ids: Array<string>, interval: string, fields?: Array<string>): Promise<Array<{
        id: string;
        data: {
            first: any;
            last: any;
        };
    }>>;
}
