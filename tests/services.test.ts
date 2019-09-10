import { DataHandler } from "../src/services/dataService";
let fdh:DataHandler;

beforeAll(() => {
    class FgpDataHandler implements DataHandler {
        source!: string;

        fetchdata(ids: string[], interval: string, range: { start: number; end: number; }, fields?: string[]): Promise<{ id: string; data: any[]; }[]> {
            throw new Error("Method not implemented.");
        }
        fetchFirstNLast(ids: string[], interval: string, fields?: string[]): Promise<{ id: string; data: { first: any; last: any; }; }[]> {
            return new Promise((resolve) => {
                resolve([{ id: "test", data: { first: 1, last: 2 } }]);
            });
        }
    }

    fdh = new FgpDataHandler();
    return fdh != null;
});


describe('Data provider test cases!', () => {

    test('sourceAttr is empty', () => {
        expect(fdh.source).toBe(undefined);
    });
    
    test('method not implemented!', () => {
        expect(fdh.fetchdata).toThrowError();
    });
    
    test('method return a promise!', () => {
        expect(fdh.fetchFirstNLast([],"")).toBeInstanceOf(Promise);
    });
    
    test('Promise value Check!', () => {
        expect(fdh.fetchFirstNLast([],"")).resolves.toMatchObject([{ id: "test", data: { first: 1, last: 2 } }]);
    });
});
