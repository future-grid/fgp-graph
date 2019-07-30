import { FgpGraph } from "./index";
import { GraphConfig } from "./vo/attrs";
let graphDiv: HTMLDivElement = document.getElementById("graphArea") as HTMLDivElement;

let data: string = "Date,Temperature\n" +
    "2008-05-01,75\n" +
    "2008-05-02,75\n" +
    "2008-05-03,75\n" +
    "2008-05-04,75\n" +
    "2008-05-05,75\n" +
    "2008-05-06,75\n" +
    "2008-05-07,75\n" +
    "2008-05-08,70\n" +
    "2008-05-09,40\n" +
    "2008-05-10,30\n" +
    "2008-05-11,20\n" +
    "2008-05-12,10\n" +
    "2008-05-13,50\n" +
    "2008-05-14,60\n" +
    "2008-05-15,70\n" +
    "2008-05-16,90\n" +
    "2008-05-17,30\n" +
    "2008-05-18,30\n" +
    "2008-05-19,30\n" +
    "2008-05-20,30\n" +
    "2008-05-21,30\n" +
    "2008-05-22,30\n" +
    "2008-05-23,30\n" +
    "2008-05-24,30\n" +
    "2008-05-25,30\n" +
    "2008-05-26,30\n" +
    "2008-05-27,30\n" +
    "2008-05-28,30\n" +
    "2008-05-29,30\n" +
    "2008-05-30,80\n";

// data not needed in the future

let gConfig: GraphConfig = new GraphConfig({}, data);

const graph: FgpGraph = new FgpGraph(graphDiv, gConfig);
