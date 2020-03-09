import {GraphCollection, GraphSeries, ViewConfig} from "../../../metadata/configurations";

export default class Series {


    private checkBoxDiv?: HTMLDivElement;

    private chosenCollection?: GraphCollection;

    private isInit: boolean = true;

    private options:Array<HTMLInputElement>;

    constructor(public parentElement: Element, public viewConfig: ViewConfig, public g?: Dygraph, onChangeListener?: () => void) {
        this.initDom();
        this.options = [];
    }


    private initDom = () => {
        let dropdownContainer: HTMLDivElement = document.createElement('div');
        dropdownContainer.setAttribute("class", "fgp-series-dropdown");

        const multiSelectDiv = document.createElement("div");
        multiSelectDiv.setAttribute("class", "graph-series-multi-select");

        //------------ select -----------------//
        const selectBoxDiv = document.createElement("div");
        selectBoxDiv.setAttribute("class", "select-box");

        let expanded = false;


        selectBoxDiv.addEventListener("click", (e: MouseEvent) => {
            // show content
            if (!expanded && this.checkBoxDiv) {
                this.checkBoxDiv.style.display = "block";
                expanded = true;
            } else if (expanded && this.checkBoxDiv) {
                this.checkBoxDiv.style.display = "none";
                expanded = false;
            }
        });
        // create select and put it into div
        const select = document.createElement("select");
        const placeholder = document.createElement("option");
        placeholder.text = "series";
        select.add(placeholder);
        selectBoxDiv.appendChild(select);
        // over select
        const overSelect = document.createElement("div");
        overSelect.setAttribute("class", "over-select");
        selectBoxDiv.append(overSelect);
        multiSelectDiv.appendChild(selectBoxDiv);


        //------------ options -----------------//
        const checkboxDiv = this.checkBoxDiv = document.createElement("div");
        checkboxDiv.setAttribute("class", "graph-series-checkboxes");
        multiSelectDiv.append(checkboxDiv);
        dropdownContainer.appendChild(multiSelectDiv);
        this.parentElement.appendChild(dropdownContainer);
    };


    private selectNDeselect = (series: string, checked: boolean) => {
        let visibility = this.g?.getOption('visibility');
        const labels = this.g?.getLabels();

        if (visibility && labels) {
            //
            labels.forEach((label: string, index: number) => {
                if (label == series) {
                    visibility[index - 1] = checked;
                }
            });
            // update graph
            this.g?.updateOptions({
                visibility: visibility
            });
        }
    };

    /**
     * create options
     * @param parentElement
     */
    private createOptions = (viewConfig: ViewConfig, parentElement?: Element) => {

        // device view or scatter view ?
        if (viewConfig.graphConfig.entities.length > 1 && parentElement) {
            parentElement.innerHTML = '';
            // scatter view
            viewConfig.graphConfig.entities.forEach(_child => {
                if (!_child.fragment) {
                    const option = document.createElement("label");
                    const checkbox = document.createElement("input");
                    checkbox.type = 'checkbox';
                    checkbox.checked = true;
                    checkbox.addEventListener('click', () => {
                        this.selectNDeselect(_child.name, checkbox.checked);
                    });
                    option.append(checkbox);
                    option.append(`${_child.name}`);
                    this.options.push(checkbox);
                    parentElement.append(option);
                }
            });


        } else if (viewConfig.graphConfig.entities.length === 1 && parentElement) {
            // device view
            parentElement.innerHTML = '';
            if (this.chosenCollection) {
                this.chosenCollection.series.forEach(_series => {
                    const option = document.createElement("label");
                    console.log(`${_series.visibility}`);
                    const checkbox = document.createElement("input");
                    checkbox.type = 'checkbox';
                    checkbox.checked = (!(_series.visibility !== undefined && !_series.visibility));
                    checkbox.addEventListener('click', () => {
                        this.selectNDeselect(_series.label, checkbox.checked);
                    });
                    option.append(checkbox);
                    option.append(`${_series.label}`);
                    this.options.push(checkbox);
                    parentElement.append(option);
                });
            }
        }
    };

    public setData = (collection: GraphCollection) => {
        this.chosenCollection = collection;
        // update options
        if (this.isInit) {
            this.createOptions(this.viewConfig, this.checkBoxDiv);
            this.isInit = false;
        }

    };

    /**
     * update dropdown selection
     * @param checked
     * @param index
     */
    public updateOption = (checked: boolean, index: number) => {
        console.log(`${checked} ${index} ${this.options[index]}`);
        if(this.options[index]){
            this.options[index].checked = checked;
        }

    };


}