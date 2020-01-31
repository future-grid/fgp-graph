import {ViewConfig} from "./configurations";
import FgpGraph from "../index";

export interface EventHandlers {
    onViewChange?(g: FgpGraph, view: ViewConfig): void;

    onIntervalChange?(g: FgpGraph, interval: { name: string, value: number, show?: boolean }): void;
}