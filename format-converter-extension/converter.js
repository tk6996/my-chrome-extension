// Converts between JSON, CSV, XML, YAML and ENV via a canonical JS value
// (parse source -> canonical value -> serialize to target format).
(function (global) {
  'use strict';

  function coerceScalar(str) {
    if (str === '') return '';
    if (/^-?\d+$/.test(str)) return parseInt(str, 10);
    if (/^-?\d*\.\d+$/.test(str)) return parseFloat(str);
    if (str === 'true') return true;
    if (str === 'false') return false;
    if (str === 'null') return null;
    return str;
  }

  // ---------- JSON ----------

  function parseJSON(text) {
    return JSON.parse(text);
  }

  function serializeJSON(value, opts) {
    if (opts && opts.minify) return JSON.stringify(value);
    return JSON.stringify(value, null, 2);
  }

  // ---------- YAML (via vendored js-yaml) ----------

  function parseYAML(text) {
    return jsyaml.load(text);
  }

  function serializeYAML(value, opts) {
    if (opts && opts.minify) return jsyaml.dump(value, { flowLevel: 0 }).trim();
    return jsyaml.dump(value, { lineWidth: -1 });
  }

  // ---------- CSV ----------

  function parseCSVRows(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    let i = 0;
    const len = text.length;

    while (i < len) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
            continue;
          }
          inQuotes = false;
          i++;
          continue;
        }
        field += ch;
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (ch === ',') {
        row.push(field);
        field = '';
        i++;
        continue;
      }
      if (ch === '\r') {
        i++;
        continue;
      }
      if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
        continue;
      }
      field += ch;
      i++;
    }
    row.push(field);
    rows.push(row);

    // Drop a single trailing empty row caused by a final newline.
    if (rows.length > 1) {
      const last = rows[rows.length - 1];
      if (last.length === 1 && last[0] === '') rows.pop();
    }
    return rows;
  }

  function parseCSV(text) {
    const rows = parseCSVRows(text);
    if (rows.length === 0) return [];
    const header = rows[0];
    return rows.slice(1).map((r) => {
      const obj = {};
      header.forEach((h, i) => {
        obj[h] = coerceScalar(r[i] !== undefined ? r[i] : '');
      });
      return obj;
    });
  }

  function csvEscape(cell) {
    const s = cell === null || cell === undefined ? '' : String(cell);
    if (/[",\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function cellValue(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }

  function serializeCSV(value) {
    let records;
    if (Array.isArray(value)) {
      if (value.every((v) => v !== null && typeof v === 'object' && !Array.isArray(v))) {
        records = value;
      } else {
        records = value.map((v) => ({ value: v }));
      }
    } else if (value !== null && typeof value === 'object') {
      records = [value];
    } else {
      records = [{ value }];
    }

    const header = [];
    records.forEach((r) => {
      Object.keys(r).forEach((k) => {
        if (!header.includes(k)) header.push(k);
      });
    });

    const lines = [header.map(csvEscape).join(',')];
    records.forEach((r) => {
      lines.push(header.map((h) => csvEscape(cellValue(r[h]))).join(','));
    });
    return lines.join('\n');
  }

  // ---------- XML ----------

  function escapeXmlText(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeXmlAttr(s) {
    return escapeXmlText(s).replace(/"/g, '&quot;');
  }

  function elementToValue(el) {
    const attrs = {};
    for (const attr of Array.from(el.attributes || [])) {
      attrs['@' + attr.name] = attr.value;
    }
    const children = Array.from(el.children);

    if (children.length === 0) {
      const text = el.textContent || '';
      if (Object.keys(attrs).length === 0) return text;
      if (text.trim() !== '') attrs['#text'] = text;
      return attrs;
    }

    const obj = Object.assign({}, attrs);
    children.forEach((child) => {
      const key = child.tagName;
      const val = elementToValue(child);
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
        obj[key].push(val);
      } else {
        obj[key] = val;
      }
    });
    return obj;
  }

  function parseXML(text) {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) throw new Error('Invalid XML: ' + errorNode.textContent.trim());
    const root = doc.documentElement;
    return { [root.tagName]: elementToValue(root) };
  }

  function buildElement(name, value, depth, compact) {
    const indent = compact ? '' : '  '.repeat(depth);
    const nl = compact ? '' : '\n';
    if (value === null || value === undefined) {
      return `${indent}<${name}/>`;
    }
    if (typeof value !== 'object') {
      return `${indent}<${name}>${escapeXmlText(value)}</${name}>`;
    }
    if (Array.isArray(value)) {
      return value.map((v) => buildElement(name, v, depth, compact)).join(nl);
    }

    let attrs = '';
    let textContent;
    const childKeys = [];
    Object.keys(value).forEach((key) => {
      if (key.startsWith('@')) {
        attrs += ` ${key.slice(1)}="${escapeXmlAttr(value[key])}"`;
      } else if (key === '#text') {
        textContent = value[key];
      } else {
        childKeys.push(key);
      }
    });

    if (childKeys.length === 0) {
      const inner = textContent !== undefined ? escapeXmlText(textContent) : '';
      return `${indent}<${name}${attrs}>${inner}</${name}>`;
    }

    const childrenXml = childKeys.map((k) => buildElement(k, value[k], depth + 1, compact)).join(nl);
    return `${indent}<${name}${attrs}>${nl}${childrenXml}${nl}${indent}</${name}>`;
  }

  function serializeXML(value, opts) {
    const compact = !!(opts && opts.minify);
    let rootName = 'root';
    let content = value;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const keys = Object.keys(value);
      if (keys.length === 1) {
        rootName = keys[0];
        content = value[keys[0]];
      }
    }
    const declaration = compact ? '<?xml version="1.0" encoding="UTF-8"?>' : '<?xml version="1.0" encoding="UTF-8"?>\n';
    return declaration + buildElement(rootName, content, 0, compact);
  }

  // ---------- ENV ----------

  function stripQuotes(raw) {
    const s = raw.trim();
    if (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"') {
      return s
        .slice(1, -1)
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
    if (s.length >= 2 && s[0] === "'" && s[s.length - 1] === "'") {
      return s.slice(1, -1);
    }
    return s;
  }

  function parseENV(text) {
    const result = {};
    text.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#')) return;
      const withoutExport = trimmed.replace(/^export\s+/, '');
      const eq = withoutExport.indexOf('=');
      if (eq === -1) return;
      const key = withoutExport.slice(0, eq).trim();
      const rawValue = withoutExport.slice(eq + 1);
      result[key] = coerceScalar(stripQuotes(rawValue));
    });
    return result;
  }

  function envEscapeValue(v) {
    const s = v === null || v === undefined ? '' : String(v);
    if (/[\s#"'=]/.test(s)) {
      return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
    }
    return s;
  }

  function flattenForEnv(value, prefix, out) {
    if (Array.isArray(value)) {
      value.forEach((v, i) => flattenForEnv(v, prefix ? `${prefix}_${i}` : String(i), out));
    } else if (value !== null && typeof value === 'object') {
      Object.keys(value).forEach((k) =>
        flattenForEnv(value[k], prefix ? `${prefix}_${k}` : k, out)
      );
    } else {
      out[prefix || 'VALUE'] = value;
    }
  }

  function serializeENV(value) {
    const flat = {};
    flattenForEnv(value, '', flat);
    return Object.entries(flat)
      .map(([k, v]) => `${k.toUpperCase()}=${envEscapeValue(v)}`)
      .join('\n');
  }

  // ---------- Public API ----------

  const parsers = {
    json: parseJSON,
    csv: parseCSV,
    xml: parseXML,
    yaml: parseYAML,
    env: parseENV,
  };

  const serializers = {
    json: serializeJSON,
    csv: serializeCSV,
    xml: serializeXML,
    yaml: serializeYAML,
    env: serializeENV,
  };

  function convert(text, fromFormat, toFormat) {
    const parser = parsers[fromFormat];
    const serializer = serializers[toFormat];
    if (!parser) throw new Error(`Unsupported source format: ${fromFormat}`);
    if (!serializer) throw new Error(`Unsupported target format: ${toFormat}`);

    let value;
    try {
      value = parser(text);
    } catch (err) {
      throw new Error(`Failed to parse ${fromFormat.toUpperCase()}: ${err.message}`);
    }

    try {
      return serializer(value);
    } catch (err) {
      throw new Error(`Failed to write ${toFormat.toUpperCase()}: ${err.message}`);
    }
  }

  function reformat(text, format, opts) {
    const parser = parsers[format];
    const serializer = serializers[format];
    if (!parser || !serializer) throw new Error(`Unsupported format: ${format}`);

    let value;
    try {
      value = parser(text);
    } catch (err) {
      throw new Error(`Failed to parse ${format.toUpperCase()}: ${err.message}`);
    }

    try {
      return serializer(value, opts);
    } catch (err) {
      throw new Error(`Failed to write ${format.toUpperCase()}: ${err.message}`);
    }
  }

  global.Converter = { convert, reformat, parsers, serializers };
})(window);
