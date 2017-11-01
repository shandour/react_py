/// <reference types="node" />
import { ChildProcess } from 'child_process';
/**
 * interface for ExecResult
 */
export interface IExecResult {
    exitCode: number;
    stdout: string;
}
/**
 * interface for streaming ExecResult
 */
export interface IExecResultStreaming {
    childProcess: ChildProcess;
    finalPromise: Promise<IExecResult>;
}
/**
 * executes a given command async
 * @param commandStringArg
 */
export declare let exec: (commandStringArg: string, silentArg?: boolean, strictArg?: boolean) => Promise<IExecResult>;
/**
 * executes a given command async and silent
 * @param commandStringArg
 */
export declare let execSilent: (commandStringArg: string) => Promise<IExecResult>;
/**
 * executes strict, meaning it rejects the promise if something happens
 */
export declare let execStrict: (commandStringArg: string) => Promise<IExecResult>;
/**
 * executes a command and allws you to stream output
 */
export declare let execStreaming: (commandStringArg: string, silentArg?: boolean) => {
    childProcess: ChildProcess;
    finalPromise: Promise<IExecResult>;
};
export declare let execStreamingSilent: (commandStringArg: string) => {
    childProcess: ChildProcess;
    finalPromise: Promise<IExecResult>;
};
/**
 * executes a command and returns promise that will be fullfilled once an putput line matches RegexArg
 * @param commandStringArg
 * @param regexArg
 */
export declare let execAndWaitForLine: (commandStringArg: string, regexArg: RegExp, silentArg?: boolean) => Promise<{}>;
export declare let execAndWaitForLineSilent: (commandStringArg: string, regexArg: RegExp) => void;
/**
 * get a path
 */
export declare let which: (cmd: string) => Promise<string>;
