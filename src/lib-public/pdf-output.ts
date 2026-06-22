import { TCreatedPdf } from 'pdfmake/build/pdfmake';

type PdfOutputMethod<T> = (callback?: (value: T) => void) => Promise<T> | void;

function getPdfOutput<T>(method: PdfOutputMethod<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    try {
      const maybePromise = method((value: T): void => resolve(value));

      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(resolve, reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

export function getPdfBlob(pdf: TCreatedPdf): Promise<Blob> {
  return getPdfOutput<Blob>(pdf.getBlob.bind(pdf) as PdfOutputMethod<Blob>);
}

export function getPdfBase64(pdf: TCreatedPdf): Promise<string> {
  return getPdfOutput<string>(pdf.getBase64.bind(pdf) as PdfOutputMethod<string>);
}
