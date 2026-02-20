import { xml2js } from 'xml-js';
import { Faktura } from '../lib-public/types/fa2.types';

export function stripPrefixes<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  type Container = Record<string, unknown> | unknown[];

  const root: Container = Array.isArray(obj) ? [] : {};
  const stack: Array<{ source: Container; target: Container }> = [
    { source: obj as Container, target: root },
  ];
  const visited = new WeakMap<object, Container>([[obj as object, root]]);

  while (stack.length > 0) {
    const frame = stack.pop();
    if (!frame) {
      continue;
    }

    const { source, target } = frame;

    if (Array.isArray(source)) {
      const targetArray = target as unknown[];

      source.forEach((value: unknown, index: number): void => {
        if (typeof value !== 'object' || value === null) {
          targetArray[index] = value;
          return;
        }

        const existing = visited.get(value);
        if (existing) {
          throw new Error('Circular structure detected while stripping XML namespaces');
        }

        const child: Container = Array.isArray(value) ? [] : {};
        visited.set(value, child);
        targetArray[index] = child;
        stack.push({ source: value as Container, target: child });
      });

      continue;
    }

    const targetObject = target as Record<string, unknown>;
    Object.entries(source).forEach(([key, value]: [string, unknown]): void => {
      const transformedKey = key.includes(':') ? key.split(':')[1] : key;

      if (typeof value !== 'object' || value === null) {
        targetObject[transformedKey] = value;
        return;
      }

      const existing = visited.get(value);
      if (existing) {
        throw new Error('Circular structure detected while stripping XML namespaces');
      }

      const child: Container = Array.isArray(value) ? [] : {};
      visited.set(value, child);
      targetObject[transformedKey] = child;
      stack.push({ source: value as Container, target: child });
    });
  }

  return root as T;
}

export function parseXML(file: File): Promise<unknown> {
  return new Promise((resolve, reject): void => {
    const reader = new FileReader();

    reader.onload = function (e: ProgressEvent<FileReader>): void {
      try {
        const xmlStr: string = e.target?.result as string;
        const jsonDoc: Faktura = stripPrefixes(xml2js(xmlStr, { compact: true })) as Faktura;

        resolve(jsonDoc);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsText(file);
  });
}
