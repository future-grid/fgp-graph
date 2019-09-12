import { DomElementOperator } from "../src/widgets/DomElements";
import { DomAttrs } from "../src/metadata/configurations";


describe('Element Creation Test Cases！', () => {

    let dom: HTMLElement;

    test('Div without any attrs', () => {
        dom = DomElementOperator.createElement("div", []);
        expect(dom.getAttribute("id")).toBe(null);
    });

    test('Div with id attribute', () => {
        const attrs: Array<DomAttrs> = [];
        let att: DomAttrs = { key: "id", value: "hello" };
        attrs.push(att);
        dom = DomElementOperator.createElement("div", attrs);
        expect(dom.getAttribute("id")).toBe("hello");
    });

    test('Duplicate attrs', () => {
        const attrs: Array<DomAttrs> = [];
        let att: DomAttrs = { key: "id", value: "hello" };
        let att1: DomAttrs = { key: "id", value: "hello1" };
        attrs.push(att);
        attrs.push(att1);
        expect(()=>{
            DomElementOperator.createElement("div", attrs);
        }).toThrowError(/id/g);
    });


});