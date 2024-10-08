export async function timit<T>(name: string, code: () => Promise<T>) : Promise<T>{
  const start = performance.now();
  const r = await code();

  const millis = performance.now() - start;
  console.log(`${name} took ${millis} to finish`);
  return r;
}
