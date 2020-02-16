import React from 'react';

/**
 * graph css
 */
import '@future-grid/fgp-graph/lib/css/graph.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import GraphContainer from "./comps/Container";



const App = () => {
    return (
        <div>
            <GraphContainer/>
        </div>
    );
};

export default App;
