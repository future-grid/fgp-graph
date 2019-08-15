import Dygraph from 'dygraphs';
export declare class Synchronizer {
    args: Array<any>;
    graphs: Array<Dygraph>;
    constructor(graphs: Array<Dygraph>);
    synchronize: () => {
        detach: () => void;
        graphs: any[][];
    };
}
