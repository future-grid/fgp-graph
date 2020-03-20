import React from 'react';

/**
 * graph css
 */
import '@future-grid/fgp-graph/lib/css/graph.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import GraphContainer from "./comps/Container";

import {library} from '@fortawesome/fontawesome-svg-core';

import {fab} from '@fortawesome/free-brands-svg-icons';

import {fas} from '@fortawesome/free-solid-svg-icons';
/**
 * we can just import the icons that we need not all of them.
 */

library.add(fab, fas);

const App = () => {
    return (
        <div>
            <GraphContainer/>
        </div>
    );
};

export default App;
