const { readFile } = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(readFile);

module.exports = {
  parseFeesFile,
};

async function parseFeesFile(filepath) {
  const fileString = await readFileAsync(filepath, 'utf8');
  return Object.fromEntries(
    fileString.split('\n').map(line => {
      const [address, fee] = line.split('=');
      return [address, normalizeFee(fee)];
    })
  );
}

function normalizeFee(fee) {
  if (fee > 1) {
    return 1;
  }
  if (fee < 0) {
    return 0;
  }
  return parseFloat(fee, 10);
}
