import Dygraph from 'dygraphs';


export default class RangeSelector {

    private g?: Dygraph;

    toString = () =>{
        return "Fgp Range-bar Plugin";
    };

    activate = (dygraph: Dygraph) => {
        this.g = dygraph;
        return {
            layout: this.reserveSpace
        };
    };

    constructor() {

    }

    destory = () => {

    };



    //-------private methods--------//

    private reserveSpace = (e:any) =>{
        
    };


}
