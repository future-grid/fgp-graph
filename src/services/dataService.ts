

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
    fetchdata(ids: Array<string>, interval: string, range: { start: number; end: number }, fields?: Array<string>): Promise<Array<{ id: string, data: Array<any> }>>;

    fetchFirstNLast(ids: Array<string>, interval: string, fields?: Array<string>): Promise<Array<{ id: string, data: { first: any, last: any } }>>;
}


export class CsvUtil {


    public static exportCsv(content: string, fileName: string){
        // simulate click "<a>"
        let downloadDom: HTMLAnchorElement = document.createElement('a');
        let mimeType: string = 'application/octet-stream';
        if (URL && 'download' in downloadDom) { 
            //html5 A[download]
            downloadDom.href = URL.createObjectURL(new Blob([content], {
                type: mimeType
            }));
            downloadDom.setAttribute('download', fileName);
            document.body.appendChild(downloadDom);
            downloadDom.click();
            document.body.removeChild(downloadDom);
        }
    }
}
