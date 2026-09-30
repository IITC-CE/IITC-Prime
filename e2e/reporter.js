import WDIOReporter from '@wdio/reporter';

// One numbered line per finished test, printed while the run is in progress
export default class ProgressReporter extends WDIOReporter {
  count = 0;

  constructor(options) {
    super({ ...options, stdout: true });
  }

  onTestPass(test) {
    this.print('✓', test);
  }

  onTestFail(test) {
    this.print('✖', test);
  }

  onTestSkip(test) {
    this.print('-', test);
  }

  print(symbol, test) {
    const seconds = (test.duration / 1000).toFixed(1);
    const content = `${++this.count}. ${symbol} ${test.parent} › ${test.title} (${seconds}s)`;
    // The launcher prints this right away; regular reporter output waits for the worker to end
    process.send?.({ name: 'reporterRealTime', content });
  }
}
