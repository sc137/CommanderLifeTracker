class ClassList {
  constructor() {
    this.set = new Set();
  }

  add(...cls) {
    cls.filter(Boolean).forEach((c) => this.set.add(c));
  }

  remove(...cls) {
    cls.forEach((c) => this.set.delete(c));
  }

  contains(c) {
    return this.set.has(c);
  }

  get value() {
    return Array.from(this.set).join(' ');
  }
}

function createEvent(type, options = {}) {
  return {
    type,
    bubbles: options.bubbles ?? true,
    cancelable: options.cancelable ?? true,
    defaultPrevented: false,
    propagationStopped: false,
    target: options.target ?? null,
    currentTarget: null,
    key: options.key,
    dataTransfer: options.dataTransfer ?? {
      effectAllowed: '',
      setData() {},
      getData() { return ''; },
    },
    preventDefault() {
      if (this.cancelable) {
        this.defaultPrevented = true;
      }
    },
    stopPropagation() {
      this.propagationStopped = true;
    },
  };
}

class Element {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.id = '';
    this.classList = new ClassList();
    this.dataset = {};
    this.attributes = {};
    this.style = {};
    this.children = [];
    this.parentNode = null;
    this._text = '';
    this._innerHTML = '';
    this.hidden = false;
    this.disabled = false;
    this.eventListeners = {};
    this.value = '';
  }

  get className() {
    return this.classList.value;
  }

  set className(v) {
    this.classList = new ClassList();
    if (v && v.trim()) {
      this.classList.add(...v.trim().split(/\s+/));
    }
  }

  get textContent() {
    return this._text;
  }

  set textContent(v) {
    this._text = String(v);
    this._innerHTML = '';
    this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(v) {
    this._innerHTML = String(v);
    this._text = '';
    this.children = [];
  }

  appendChild(el) {
    el.parentNode = this;
    this.children.push(el);
    return el;
  }

  insertBefore(newNode, refNode) {
    const idx = this.children.indexOf(refNode);
    if (idx === -1) return this.appendChild(newNode);
    newNode.parentNode = this;
    this.children.splice(idx, 0, newNode);
    return newNode;
  }

  removeChild(el) {
    const idx = this.children.indexOf(el);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      el.parentNode = null;
    }
  }

  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'id') this.id = String(value);
    if (name === 'class') this.className = String(value);
    if (name === 'value') this.value = String(value);
    if (name.startsWith('data-')) this.dataset[name.slice(5)] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  removeAttribute(name) {
    delete this.attributes[name];
    if (name === 'id') this.id = '';
  }

  addEventListener(event, handler, options = {}) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push({ handler, once: Boolean(options.once) });
  }

  removeEventListener(event, handler) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event] = this.eventListeners[event].filter(
      (listener) => listener.handler !== handler
    );
  }

  dispatchEvent(event) {
    const evt = event.type ? event : createEvent(event);
    if (!evt.target) {
      evt.target = this;
    }
    evt.currentTarget = this;

    const listeners = [...(this.eventListeners[evt.type] || [])];
    for (const listener of listeners) {
      listener.handler.call(this, evt);
      if (listener.once) {
        this.removeEventListener(evt.type, listener.handler);
      }
      if (evt.propagationStopped) {
        return !evt.defaultPrevented;
      }
    }

    if (evt.bubbles && this.parentNode) {
      return this.parentNode.dispatchEvent(evt);
    }

    return !evt.defaultPrevented;
  }

  click() {
    return this.dispatchEvent(createEvent('click'));
  }

  focus() {
    if (global.document) global.document.activeElement = this;
  }

  matches(selector) {
    return selector
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .some((item) => elementMatches(this, parseSimpleSelector(item)));
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (current.matches && current.matches(selector)) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  querySelector(selector) {
    if (selector.includes(',')) {
      return findFirstMatch(this, selector);
    }
    const res = this.querySelectorAll(selector);
    return res[0] || null;
  }

  querySelectorAll(selector) {
    const groups = selector.split(',').map((s) => s.trim()).filter(Boolean);
    const results = [];
    for (const group of groups) {
      const parts = group.split(/\s+/).map(parseSimpleSelector);
      results.push(...queryAll(this, parts));
    }
    return results;
  }
}

function traverse(root, cb) {
  for (const child of root.children) {
    if (cb(child) === false) return false;
    if (traverse(child, cb) === false) return false;
  }
  return true;
}

function parseSimpleSelector(token) {
  const result = { tag: null, id: null, classes: [], attrs: {} };
  let t = token;
  let m;
  if ((m = t.match(/^([a-zA-Z]+)/))) {
    result.tag = m[1].toUpperCase();
    t = t.slice(m[1].length);
  }
  while ((m = t.match(/^#([a-zA-Z0-9_-]+)/))) {
    result.id = m[1];
    t = t.slice(m[0].length);
  }
  while ((m = t.match(/^\.([a-zA-Z0-9_-]+)/))) {
    result.classes.push(m[1]);
    t = t.slice(m[0].length);
  }
  while ((m = t.match(/^\[([a-zA-Z0-9_-]+)(?:="([^"]*)")?\]/))) {
    result.attrs[m[1]] = m[2] || null;
    t = t.slice(m[0].length);
  }
  return result;
}

function elementMatches(el, sel) {
  if (sel.tag && el.tagName !== sel.tag) return false;
  if (sel.id && el.id !== sel.id) return false;
  for (const cls of sel.classes) {
    if (!el.classList.contains(cls)) return false;
  }
  for (const [k, v] of Object.entries(sel.attrs)) {
    const val = k.startsWith('data-') ? el.dataset[k.slice(5)] : el.attributes[k];
    if (v != null) {
      if (val !== v) return false;
    } else if (val == null) {
      return false;
    }
  }
  return true;
}

function queryAll(root, selectors, idx = 0) {
  const sel = selectors[idx];
  const matches = [];
  traverse(root, (el) => {
    if (elementMatches(el, sel)) matches.push(el);
  });
  if (idx === selectors.length - 1) return matches;
  const results = [];
  for (const el of matches) {
    results.push(...queryAll(el, selectors, idx + 1));
  }
  return results;
}

function findFirstMatch(root, selector) {
  const groups = selector.split(',').map((item) => item.trim()).filter(Boolean);
  let found = null;
  traverse(root, (el) => {
    if (groups.some((group) => el.matches(group))) {
      found = el;
      return false;
    }
    return true;
  });
  return found;
}

class Document {
  constructor() {
    this.body = new Element('body');
    this.activeElement = null;
    this.eventListeners = {};
  }

  createElement(tagName) {
    return new Element(tagName);
  }

  addEventListener(event, handler, options = {}) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push({ handler, once: Boolean(options.once) });
  }

  removeEventListener(event, handler) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event] = this.eventListeners[event].filter(
      (listener) => listener.handler !== handler
    );
  }

  dispatchEvent(event) {
    const evt = event.type ? event : createEvent(event, { bubbles: false });
    evt.target = evt.target ?? this;
    evt.currentTarget = this;
    const listeners = [...(this.eventListeners[evt.type] || [])];
    for (const listener of listeners) {
      listener.handler.call(this, evt);
      if (listener.once) {
        this.removeEventListener(evt.type, listener.handler);
      }
      if (evt.propagationStopped) {
        return !evt.defaultPrevented;
      }
    }
    return !evt.defaultPrevented;
  }

  getElementById(id) {
    let found = null;
    traverse(this.body, (el) => {
      if (el.id === id) {
        found = el;
        return false;
      }
      return true;
    });
    return found;
  }

  querySelector(selector) {
    if (selector.includes(',')) {
      return findFirstMatch(this.body, selector);
    }
    const res = this.querySelectorAll(selector);
    return res[0] || null;
  }

  querySelectorAll(selector) {
    const groups = selector.split(',').map((s) => s.trim()).filter(Boolean);
    const results = [];
    for (const group of groups) {
      const parts = group.split(/\s+/).map(parseSimpleSelector);
      results.push(...queryAll(this.body, parts));
    }
    return results;
  }
}

function createDOM() {
  const doc = new Document();
  global.document = doc;
  return doc;
}

export { Element, Document, createDOM, createEvent };
