/**
 * Returns an array of the results of calling a given function
 * n times, passing it indexes from zero to n - 1.
 */
function mapN(n, fn) {
  const results = [];
  for (let i = 0; i < n; i++) {
    results.push(fn(i));
  }
  return results;
}

export default mapN;
