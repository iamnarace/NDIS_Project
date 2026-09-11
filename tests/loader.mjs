import fs from 'node:fs';

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') {
    return {
      format: 'module',
      shortCircuit: true,
      url: 'data:text/javascript,export default {};',
    };
  }

  if (specifier.startsWith('@/')) {
    const root = new URL('../', import.meta.url);
    const rawPath = specifier.slice(2);
    const tsUrl = new URL(rawPath + '.ts', root);
    const tsxUrl = new URL(rawPath + '.tsx', root);
    const indexTsUrl = new URL(rawPath + '/index.ts', root);
    const directUrl = new URL(rawPath, root);

    if (fs.existsSync(directUrl) && !fs.statSync(directUrl).isDirectory()) {
      return nextResolve(directUrl.href, context);
    }
    if (fs.existsSync(tsUrl)) {
      return nextResolve(tsUrl.href, context);
    }
    if (fs.existsSync(tsxUrl)) {
      return nextResolve(tsxUrl.href, context);
    }
    if (fs.existsSync(indexTsUrl)) {
      return nextResolve(indexTsUrl.href, context);
    }
  }
  return nextResolve(specifier, context);
}
