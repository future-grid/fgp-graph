import {ViewConfig} from "./configurations";

export interface EventHandlers {
    onViewChange?(view: ViewConfig): void;

    onIntervalChange?(interval: { name: string, value: number, show?: boolean }): void;
}