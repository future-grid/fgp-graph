import utils from "./utils";

export default class IFrameTarp {


    private tarps: Array<HTMLDivElement>;


    constructor() {
        this.tarps = [];
    }


    cover = () => {
        let iframes: HTMLCollectionOf<HTMLIFrameElement> = document.getElementsByTagName('iframe');

        for (let i = 0; i < iframes.length; i++) {
            const iframe = iframes[i];
            let pos = utils.findPos(iframe),
                x = pos.x,
                y = pos.y,
                width = iframe.offsetWidth,
                height = iframe.offsetHeight;

            let div: HTMLDivElement = document.createElement("div");
            div.style.position = "absolute";
            div.style.left = x + 'px';
            div.style.top = y + 'px';
            div.style.width = width + 'px';
            div.style.height = height + 'px';
            div.style.zIndex = "999";
            // add to body
            document.body.appendChild(div);
            this.tarps.push(div);
        }

    };

    uncover = () =>{
        for (let i = 0; i < this.tarps.length; i++) {
            document.body.removeChild(this.tarps[i]);
        }
        this.tarps = [];
    };


}