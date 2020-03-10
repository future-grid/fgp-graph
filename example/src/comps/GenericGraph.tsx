import React, {Component} from "react";
import {ViewConfig} from "@future-grid/fgp-graph/lib/metadata/configurations";
import FgpGraph from "@future-grid/fgp-graph";



type GraphProps = {
    viewConfigs: Array<ViewConfig>,
    onReady?(div: HTMLDivElement, g: FgpGraph): void,
    viewChangeListener?(g: FgpGraph, view: ViewConfig): void,
    intervalChangeListener?(g: FgpGraph, interval: { name: string; value: number; show?: boolean }): void
};

type GraphStates = {
    id: number
};

export default class GenericGraph extends Component<GraphProps, GraphStates> {

    mainGraph = React.createRef<HTMLDivElement>();

    constructor(props: GraphProps) {
        super(props);
        this.state = {
            id: Math.random() * 1000
        };
    }


    componentDidMount(): void {
        if (this.mainGraph.current) {
            let graph = new FgpGraph(this.mainGraph.current, this.props.viewConfigs, {
                onViewChange: this.props.viewChangeListener,
                onIntervalChange: this.props.intervalChangeListener
            }, true);
            if (this.props.onReady) {
                graph.initGraph((g: FgpGraph) => {
                    if (this.props.onReady && this.mainGraph.current) {
                        this.props.onReady(this.mainGraph.current, graph);
                    }
                }, true);
            } else {
                graph.initGraph(undefined, true);
            }

        }

    }


    render() {
        const divStyle = {
            width: '100%',
            height: '400px',
            padding: '10px'
        };
        return (
            <div>
                <div fgp-graph-id={'Graph' + this.state.id} ref={this.mainGraph} style={divStyle}/>
            </div>
        )
    }
}