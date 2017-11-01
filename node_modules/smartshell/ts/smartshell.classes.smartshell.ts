import * as plugins from './smartshell.plugins'
import * as smartshellWrap from './smartshell.wrap'

export type TExecutor = 'sh' | 'bash'

export interface ISmartshellContructorOptions {
  executor: TExecutor
  sourceFilePaths: string[]

}

export class Smartshell {
  executor: TExecutor
  sourceFileArray: string[] = []
  constructor (optionsArg: ISmartshellContructorOptions) {
    this.executor = optionsArg.executor
    for (let sourceFilePath of optionsArg.sourceFilePaths) {
      this.sourceFileArray.push(sourceFilePath)
    }
  }

  addSourceFiles (sourceFilePathsArray: string[]) {
    for (let sourceFilePath of sourceFilePathsArray) {
      this.sourceFileArray.push(sourceFilePath)
    }
  }

  cleanSourceFiles () {
    this.sourceFileArray = []
  }

  /**
   * executes silently and returns IExecResult
   * @param commandArg
   */
  async execSilent (commandArg: string) {
    let execCommand = this.createExecString(commandArg)
    return await smartshellWrap.execSilent(execCommand)
  }

  /**
   * executes and returns IExecResult
   * @param commandArg
   */
  async exec (commandArg: string) {
    let execCommand = this.createExecString(commandArg)
    return await smartshellWrap.exec(execCommand)
  }

  /**
   * creates the final sourcing string
   * @param commandArg
   */
  private createExecString (commandArg): string {
    if (this.executor === 'bash') {
      let sourceString = ''
      for (let sourceFilePath of this.sourceFileArray) {
        sourceString = sourceString + `source ${sourceFilePath} && `
      }
      return `bash -c '${sourceString} ${commandArg}'`
    } else {
      return commandArg
    }
  }
}
