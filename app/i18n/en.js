const baseLocale = require('./en.default.json');

const result = { ...baseLocale };
result['app.name'] = baseLocale.app.name[process.env.BUILD_TYPE] || baseLocale.app.name.debug;
delete result.app.name;

module.exports = result;
