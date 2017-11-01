import * as smartshellWrap from './smartshell.wrap';
export declare type TExecutor = 'sh' | 'bash';
export interface ISmartshellContructorOptions {
    executor: TExecutor;
    sourceFilePaths: string[];
}
export declare class Smartshell {
    executor: TExecutor;
    sourceFileArray: string[];
    constructor(optionsArg: ISmartshellContructorOptions);
    addSourceFiles(sourceFilePathsArray: string[]): void;
    cleanSourceFiles(): void;
    /**
     * executes silently and returns IExecResult
     * @param commandArg
     */
    execSilent(commandArg: string): Promise<smartshellWrap.IExecResult>;
    /**
     * executes and returns IExecResult
     * @param commandArg
     */
    exec(commandArg: string): Promise<smartshellWrap.IExecResult>;
    /**
     * creates the final sourcing string
     * @param commandArg
     */
    private createExecString(commandArg);
}
