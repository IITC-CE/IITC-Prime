// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

let _evaluator = null;

export const webviewService = {
  register(evaluateFn) {
    _evaluator = evaluateFn;
  },
  unregister() {
    _evaluator = null;
  },
  async evaluate(js) {
    if (!_evaluator) return null;
    return _evaluator(js);
  },
};
