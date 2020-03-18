import ExDataService from "../src/services/ExDataService";
import {DataHandler} from "../../lib/services/dataService";

let fdh: DataHandler;
beforeAll(() => {
    fdh = new ExDataService();
    return fdh != null;
});


describe('Data provider test cases!', () => {

    test('sourceAttr is not empty', () => {
        expect(fdh.source).toBe('helloWorld');
    });

    test('multi-request for "fetchdata"', () => {
        // call 4 times
        for (let i = 0; i < 4; i++) {
            fdh.fetchdata(["A", "B", "C"], "meter", "meter_read_raw", {start: 100, end: 200}).then((result) => {
                console.log(`${i}`);
                expect(result.length).toBe(3);
            });
        }
    });

});
