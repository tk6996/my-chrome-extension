const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const context = vm.createContext({});
context.window = context;
for (const file of ['vendor/js-yaml.min.js', 'converter.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), context);
}
const { Converter, jsyaml } = context;
const load = (text) => JSON.parse(JSON.stringify(jsyaml.load(text)));

test('ENV to Rancher YAML quotes numbers/booleans and preserves exact text', () => {
  const output = Converter.convert('PORT=8080\nDEBUG=true\nOFF=false\nCODE=00123\nBIG=9007199254740993\nEMPTY=\nNULL=null', 'env', 'rancher-yaml');
  assert.match(output, /PORT: '8080'/);
  assert.match(output, /DEBUG: 'true'/);
  assert.deepEqual(load(output), {
    PORT: '8080', DEBUG: 'true', OFF: 'false', CODE: '00123',
    BIG: '9007199254740993', EMPTY: '', NULL: 'null',
  });
});

test('JSON nested config and env lists stringify numeric/boolean values', () => {
  const output = Converter.convert(JSON.stringify({
    env: [{ name: 'PORT', value: 8080 }, { name: 'DEBUG', value: false }],
    nested: { ratio: 1.5, missing: null },
  }), 'json', 'rancher-yaml');
  assert.match(output, /value: '8080'/);
  assert.match(output, /value: 'false'/);
  assert.deepEqual(load(output), {
    env: [{ name: 'PORT', value: '8080' }, { name: 'DEBUG', value: 'false' }],
    nested: { ratio: '1.5', missing: null },
  });
});

test('quotes, punctuation, unicode and multiline strings survive serialization', () => {
  const input = { QUOTE: "it's fine", URL: 'https://example.com/#part', THAI: 'ทดสอบ', MULTI: 'first\nsecond' };
  const output = Converter.convert(JSON.stringify(input), 'json', 'rancher-yaml');
  assert.match(output, /QUOTE: it's fine/);
  assert.deepEqual(load(output), input);
});

test('ordinary text is unquoted while typed-looking values remain quoted', () => {
  const source = 'HOST=localhost\nMODE=production\nPORT=8080\nDEBUG=true\nMESSAGE=hello: world';
  const converted = Converter.convert(source, 'env', 'rancher-yaml');
  for (const output of [converted,
    Converter.reformat(converted, 'rancher-yaml', { minify: false }),
    Converter.reformat(converted, 'rancher-yaml', { minify: true })]) {
    assert.match(output, /HOST: localhost/);
    assert.match(output, /MODE: production/);
    assert.match(output, /PORT: '8080'/);
    assert.match(output, /DEBUG: 'true'/);
    assert.match(output, /MESSAGE: 'hello: world'/);
    assert.deepEqual(load(output), {
      HOST: 'localhost', MODE: 'production', PORT: '8080', DEBUG: 'true', MESSAGE: 'hello: world',
    });
  }
});

test('Pretty and Minify retain Rancher string values', () => {
  const source = 'PORT: 8080\nDEBUG: true\nCODE: "00123"';
  for (const minify of [false, true]) {
    const output = Converter.reformat(source, 'rancher-yaml', { minify });
    assert.deepEqual(load(output), { PORT: '8080', DEBUG: 'true', CODE: '00123' });
    assert.match(output, /'8080'/);
    assert.match(output, /'true'/);
    assert.deepEqual(load(Converter.reformat(output, 'rancher-yaml', { minify: false })), load(output));
  }
});

test('Rancher YAML can be converted back to JSON and ENV', () => {
  const source = "PORT: '8080'\nDEBUG: 'true'";
  assert.deepEqual(JSON.parse(Converter.convert(source, 'rancher-yaml', 'json')), { PORT: '8080', DEBUG: 'true' });
  assert.equal(Converter.convert(source, 'rancher-yaml', 'env'), 'PORT=8080\nDEBUG=true');
});

test('ordinary YAML retains numeric/boolean types', () => {
  assert.deepEqual(load(Converter.convert('PORT=8080\nDEBUG=true', 'env', 'yaml')), { PORT: 8080, DEBUG: true });
  assert.deepEqual(load(Converter.reformat('replicas: 2\nenabled: false', 'yaml', {})), { replicas: 2, enabled: false });
});

test('invalid YAML still reports a parsing error', () => {
  assert.throws(() => Converter.convert('PORT: [', 'rancher-yaml', 'json'), /Failed to parse/);
});

test('both format selectors expose Rancher YAML for Convert and Swap', () => {
  const html = fs.readFileSync(path.join(__dirname, 'popup.html'), 'utf8');
  for (const id of ['fromFormat', 'toFormat']) {
    const select = html.match(new RegExp(`<select id="${id}">([\\s\\S]*?)</select>`));
    assert.ok(select);
    assert.match(select[1], /value="rancher-yaml"/);
  }
});
