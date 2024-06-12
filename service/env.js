import path from "path";
import fs from "fs";
import dotEnv from "dotEnv";

// 先构造出.env*文件的绝对路径
const appDirectory = fs.realpathSync(process.cwd());
// 获取当前目录的父目录路径
const parentDirectory = fs.realpathSync(appDirectory + '/..');
const resolveApp = (relativePath) => path.resolve(parentDirectory, relativePath);
const pathsDotenv = resolveApp(".env");

// 按优先级由高到低的顺序加载.env文件
dotEnv.config({ path: `${pathsDotenv}.local` })  // 加载.env.local
dotEnv.config({ path: `${pathsDotenv}.development` })  // 加载.env.development
dotEnv.config({ path: `${pathsDotenv}` })  // 加载.env

