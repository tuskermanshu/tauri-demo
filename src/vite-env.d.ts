/// <reference types="vite/client" />

// 首先定义文件信息接口
interface FileInfo {
    name: string
    path: string
    isDirectory: boolean
    size: number
    createTime: Date
    updateTime: Date
  }
  
  // 定义API接口
  interface FileAPI {
    getFiles(dirPath: string): Promise<FileInfo[]>  // 通常文件操作应该返回Promise
    selectFolder: () => Promise<string | null>;
    getPath:(path:string,file:string)=>Promise<string | null>
  }
  
  // 扩展Window接口
  declare global {
    interface Window {
      fileApi: FileAPI  // 注意这里使用 fileApi 而不是 fileAPI (保持命名一致性)
    }
  }
  
  // 如果需要导出类型供其他文件使用
  export type { FileInfo, FileAPI }