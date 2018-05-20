/// <reference types="node" />
import express from 'express';
import Handlebars from 'handlebars';
import AsyncLock from 'async-lock';
import fsPromises from 'fs/promises';

const app = express();

function promiseToNode<T>(promise: Promise<T>, callback: (err?: Error, data?: T) => void): void {
  promise.then(data => callback(null, data)).catch(err => callback(err));
}
/**
 * Returns a Promise that resolves after the specified number of milliseconds have elapsed.
 * @param ms
 */
function sleepPromise(ms: number): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}
type TemplateOptions = {[key: string]: any};
type TemplateCallback = (err?: Error, tmpl?: string) => void;
class TemplateEntry {
  mtime: Number;
  tmpl: Handlebars.TemplateDelegate<TemplateOptions>;

  constructor(mtime: Number, tmpl: Handlebars.TemplateDelegate<TemplateOptions>) {
    this.mtime = mtime;
    this.tmpl = tmpl;
  }
}
const templateCache = new Map<string, TemplateEntry>();
const templateCacheLock = new AsyncLock();
async function handlebarsEngine(path: string, options: TemplateOptions): Promise<string> {
  const fd = await fsPromises.open(path, 'r');
  const stats = await fd.stat();
  let templateEntry = templateCache.get(path);
  if (!templateEntry || stats.mtimeMs > templateEntry.mtime) {
    templateEntry = (await templateCacheLock.acquire(path, async () => {
      let tmpEntry = templateCache.get(path);
      if (tmpEntry && stats.mtimeMs <= tmpEntry.mtime) {
        console.log(`[DEBUG] We avoided a race yo!`);
        return tmpEntry;
      } else {
        console.log(`Loading template ${path}`);
        const fileContents = await fd.readFile({encoding: 'utf-8'});
        tmpEntry = new TemplateEntry(
          stats.mtimeMs,
          Handlebars.compile(fileContents)
        );
        templateCache.set(path, tmpEntry);
        console.log(`Done loading template ${path}`);
        return tmpEntry;
      }
    })) as any as TemplateEntry;
  }
  return templateEntry.tmpl(options);
}
app.engine('handlebars', (path: string, options: TemplateOptions, callback: TemplateCallback) => {
  promiseToNode(handlebarsEngine(path, options), callback);
});
app.set('view engine', 'handlebars');

function determinePort(): number {
  const defaultPort = 80;
  if (process.env.PORT) {
    return parseInt(process.env.PORT);
  } else {
    return defaultPort;
  }
}

const port = determinePort();

app.get('/', (req, res) => {
  res.render('home');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Started server on port ${port}`);
});
