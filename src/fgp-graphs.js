import Dygraph from 'dygraphs';

if (typeof Dygraph !== 'object') {
    throw new Error('Dygraph2.1.0 must be loaded.');
}


let init=(div, data, opts)=>{
    const mainGraph = new Dygraph(div,data, opts);
};

let FgpGraph = (div, data, opts)=>{
    init(div, data, opts);
};


FgpGraph.NAME = "fgpgraphs";
FgpGraph.VERSION = "1.0.0";

