import { PDFDocument } from 'pdf-lib';

async function test() {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  const base64Jpg = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const bytes = Uint8Array.from(atob(base64Jpg), c => c.charCodeAt(0));
  const img = await doc.embedJpg(bytes);
  
  console.log('img.embedder:', Object.getOwnPropertyNames(Object.getPrototypeOf((img as any).embedder)));
  console.log('img.ref:', img.ref.toString());
  // Let's print any fields on img.embedder
  console.log('img.embedder keys:', Object.keys((img as any).embedder));
}

test();
