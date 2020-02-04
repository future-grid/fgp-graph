import html2canvas from 'html2canvas';
import { GraphSeries } from '../metadata/configurations';
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
    fetchdata(ids: Array<string>, deviceType:string, interval: string, range: { start: number; end: number }, fields?: Array<string>, seriesConfig?: Array<GraphSeries>): Promise<Array<{ id: string, data: Array<any> }>>;

    fetchFirstNLast(ids: Array<string>, devieType:string, interval: string, fields?: Array<string>): Promise<Array<{ id: string, data: { first: any, last: any } }>>;
}


export class LoadingSpinner {

    private spinner: HTMLElement;

    private spinnerHtml: string = `
            <svg width="16px" height="12px">
                <polyline id="back" points="1 6 4 6 6 11 10 1 12 6 15 6"></polyline>
                <polyline id="front" points="1 6 4 6 6 11 10 1 12 6 15 6"></polyline>
            </svg>
        `;
    public isLoading: boolean = false;

    constructor(public container: HTMLElement) {
        this.spinner = document.createElement('div');
        this.spinner.setAttribute("class", "indicator");
        this.spinner.innerHTML = this.spinnerHtml;
    }

    public show(): void {
        // add into parent
        this.container.append(this.spinner);
        this.isLoading = true;
    }

    public done(): void {
        this.container.removeChild(this.spinner);
        this.isLoading = false;
    }

}

export class ExportUtils {

    public static exportCsv(content: string, fileName: string) {
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

    public static saveAsImage(graphDiv: HTMLElement, fileName: string) {
        if (graphDiv) {
            // to blob and then download
            html2canvas(graphDiv).then(canvas => {
                canvas.toBlob(blobData => {
                    if (blobData) {
                        let downloadDom: HTMLAnchorElement = document.createElement('a');
                        if (URL && 'download' in downloadDom) {
                            //html5 A[download]
                            downloadDom.href = URL.createObjectURL(blobData);
                            downloadDom.setAttribute('download', fileName);
                            document.body.appendChild(downloadDom);
                            downloadDom.click();
                            document.body.removeChild(downloadDom);
                        }
                    }
                });
            });
        }
    }

}
