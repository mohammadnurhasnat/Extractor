import { createWorker } from 'tesseract.js';
import { parse as parseMRZ } from 'mrz';

async function test() {
  console.log('tesseract available:', typeof createWorker);
  console.log('mrz parse available:', typeof parseMRZ);
}
test();
