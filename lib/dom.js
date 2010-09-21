
var htmlparser = require('../node-htmlparser/lib/node-htmlparser');

/**
 * Principles:
 * 1. Document ownership is the job of the child and not the parent (it's
 *  easier done that way, and document ownership does not change)
 * 2. Element ownership is the job of the parent and not the child (the remove
 *  methods are on the parent and not the child)
 */

/**
 *
 */
function Node() {
};

Node.ELEMENT_NODE = 1;
Node.ATTRIBUTE_NODE = 2;
Node.TEXT_NODE = 3;
Node.CDATA_SECTION_NODE = 4;
Node.ENTITY_REFERENCE_NODE = 5;
Node.ENTITY_NODE = 6;
Node.PROCESSING_INSTRUCTION_NODE = 7;
Node.COMMENT_NODE = 8;
Node.DOCUMENT_NODE = 9;
Node.DOCUMENT_TYPE_NODE = 10;
Node.DOCUMENT_FRAGMENT_NODE = 11;
Node.NOTATION_NODE = 12;

/**
 * Pretend to be a W3C DOM Document
 * @param start {string|HtmlElement|null} The starting document can be a string
 * in which case this will be taken to be HTML to be parsed, or we can pass in
 * an existing element to be used as the documentElement, or we can pass in
 * nothing to start with something like "<html><body></body></html>"
 */
function Document(start) {
  if (start === undefined || start === null) {
    this.documentElement = this.createElement('html');
    this.documentElement.appendChild(this.createElement('body'));
  } else if (typeof start === 'string') {
    this._appendHTML(start);
  } else {
    this.documentElement = start;
  }
  this._debug = this.toString();
};

Object.defineProperties(Document.prototype, {

  toString: {
    value: function() {
      return 'Document(title=' + this.title + ')';
    }
  },

  title: {
    get: function() {
      if (!this.documentElement) {
         return '';
      }
      var heads = this.documentElement.getElementsByTagName('head');
      if (heads.length === 0) {
        return '';
      }
      var titles = heads[0].getElementsByTagName('title');
      if (titles.length === 0) {
        return '';
      }
      return titles[0].textContent;
    }
  },

  body: {
    get: function() {
      var bodies = this.documentElement.getElementsByTagName('body');
      return (bodies.length > 0) ? bodies[0] : null;
    }
  },

  nodeType: { value: Node.DOCUMENT_NODE },

  getElementById: {
    value: function(id) {
      return this.documentElement.getElementById(id);
    }
  },

  getElementsByTagName: {
    value: function(name) {
      return this.documentElement.getElementsByTagName(name);
    }
  },

  createElement: { value: function(name) { return new Element(name, this); } },
  createTextNode: { value: function(text) { return new Text(text, this); } },
  createComment: { value: function(text) { return new Comment(text, this); } },

  innerHTML: {
    get: function() {
      return this.documentElement.innerHTML;
    }
  },

  innerText: {
    get: function() {
      return this.documentElement.innerText;
    }
  },

  _parse: {
    value: function(data) {
      var handler = new htmlparser.DefaultHandler(function(error, dom) {
        if (error) {
          console.error(error);
        }
      }, { ignoreWhitespace: true, verbose: false });

      var parser = new htmlparser.Parser(handler);
      parser.parseChunk(data);
      parser.done();
      return handler.dom;
    }
  },

  _appendHTML: {
    value: function(data, element) {
      var extDom = this._parse(data);

      if (element) {
        // Existing node. Jump straight into the nested handler
        extDom.forEach(function(extNode) {
          var newChild = this._convertElement(extNode, this);
          if (newChild) {
            element.appendChild(newChild);
          }
        }, this);
        return;
      }

      // We're at the top level of a document, not an element
      extDom.forEach(function(extNode) {
        // Processing directives supported at top level only
        if (extNode.type === 'directive') {
          if (extNode.name === '?xml') {
            return null;
          }
          if (extNode.name !== '!DOCTYPE') {
            throw new Error('Unsupported directive: ' + extNode.name);
          }
          if (this.doctype) {
            throw new Error('Multiple !DOCTYPE directives');
          }
          this.doctype = new DocumentType(extNode.data.substring(9), this);
        }

        // Skip the text, comments and directives at the top level
        if (extNode.type === 'tag') {
          if (this.documentElement) {
            throw new Error('2nd root element: ' + extNode.name + '.');
          }

          this.documentElement = this._convertElement(extNode, this);
        }
      }, this);
    }
  },

  /**
   * Take the input from a part of a node-htmlparser tree and convert it to a fake
   * dom Element
   */
  _convertElement: {
    value: function(extNode, document) {
      if (extNode.type === 'tag' || extNode.type === 'script' || extNode.type === 'style') {
        var element = document.createElement(extNode.name);

        if (extNode.children) {
          extNode.children.forEach(function(child) {
            var childNode = this._convertElement(child, document);
            if (childNode) {
              element.appendChild(childNode);
            }
          }, this);
        }

        if (extNode.attribs) {
          for (var name in extNode.attribs) {
            element.setAttribute(name, extNode.attribs[name]);
          }
        }

        return element;
      }

      if (extNode.type === 'text') {
        return document.createTextNode(extNode.data);
      }

      if (extNode.type === 'comment') {
        return document.createComment(extNode.data);
      }

      if (extNode.type === 'directive') {
        return null;
      }

      throw new Error('Unhandled node type: ' + extNode.type);
    }
  }
});

/**
 * Pretend to be a W3C DOM Document
 */
function DocumentType(ownerDocument, name) {
  this.name = name;
  this.ownerDocument = ownerDocument;

  this.entities = new NamedNodeMap(ownerDocument);
  this.entities.parentNode = ownerDocument.documentElement;
  this.notations = new NamedNodeMap(ownerDocument);
  this.notations.parentNode = ownerDocument.documentElement;
  this.publicId = null;
  this.systemId = null;
  this.internalSubset = null;

  this._debug = this.toString();
};

Object.defineProperties(DocumentType.prototype, {
  toString: {
    value: function() {
      return 'DocumentType(name=' + this.name + ')';
    }
  },

  _stringify: {
    value: function() {
      return '<!DOCTYPE ' + this.name + '>';
    }
  }
});

/**
 * Pretend to be a W3C DOM Text Node
 */
function Text(data, ownerDocument) {
  this.data = data;
  this.ownerDocument = ownerDocument;

  this.parentNode = null;

  this._debug = this.toString();
};

Object.defineProperties(Text.prototype, {

  nodeType: { value: Node.TEXT_NODE },
  nodeName: { value: '#text' },

  toString: {
    value: function() {
      return 'Text(' + this.data + ')';
    }
  },

  cloneNode: {
    value: function(deep) {
      return new Text(this.data, this.ownerDocument);
    }
  },

  splitText: {
    value: function() {
      throw new Error('not implemented');
    }
  },

  _stringify: {
    value: function() {
      return this.data;
    }
  }
});

/**
 * Pretend to be a W3C DOM Comment
 */
function Comment(data, ownerDocument) {
  this.data = data;
  this.ownerDocument = ownerDocument;

  this.parentNode = null;

  this._debug = this.toString();
};

Object.defineProperties(Comment.prototype, {

  toString: {
    value: function() {
      return this._stringify();
    }
  },

  nodeType: { value: Node.COMMENT_NODE },

  cloneNode: {
    value: function(deep) {
      return new Comment(this.data, this.ownerDocument);
    }
  },

  _stringify: {
    value: function() {
      return '<!--' + this.data + '-->';
    }
  }
});

/**
 * Pretend to be a W3C DOM Element
 */
function Element(name, ownerDocument) {
  this.name = name;
  this.ownerDocument = ownerDocument;

  this.parentNode = null;
  this.childNodes = new NodeList(this.ownerDocument);
  this.childNodes.parentNode = this;
  this.attributes = new NamedNodeMap(this.ownerDocument);
  this.attributes.parentNode = this;

  this._debug = this.toString();
};

Object.defineProperties(Element.prototype, {

  nodeName: { get: function() { return this.name; } },
  nodeType: { value: Node.ELEMENT_NODE },

  toString: {
    value: function() {
      if (this.id) {
        return '<' + this.name + ' id="' + this.id + '" ...';
      }
      if (this.className) {
        return '<' + this.name + ' class="' + this.className + '" ...';
      }
      return '<' + this.name + ' ...';
    }
  },

  appendChild: {
    value: function(child) {
      return this.childNodes.appendChild(child);
    }
  },

  textContent: {
    get: function() {
      var text = '';
      this._walk({
        visitText: function(node) {
          text += node.data;
        }
      });
      return text;
    }
  },

  removeAttribute: {
    value: function(name) {
      this.attributes.removeNamedItem(name);
    }
  },

  hasAttribute: {
    value: function(name) {
      return this.attributes.getNamedItem(name) !== undefined;
    }
  },

  setAttribute: {
    value: function(name, value) {
      var attr = new Attr(name, value, this.ownerDocument);
      this.attributes.setNamedItem(attr);
    }
  },

  getAttribute: {
    value: function(name) {
      var attr = this.attributes.getNamedItem(name);
      return attr !== undefined ? attr.value : null;
    }
  },

  getAttributeNode: {
    value: function(name) {
      return this.attributes.getNamedItem(name);
    }
  },

  setAttributeNode: {
    value: function(attr) {
      return this.attributes.setNamedItem(attr);
    }
  },

  id: {
    get: function() {
      return this.getAttribute('id');
    },

    set: function(value) {
      this.setAttribute('id', value);
    }
  },

  className: {
    get: function() {
      return this.getAttribute('class');
    },

    set: function(value) {
      this.setAttribute('class', value);
    }
  },

  getElementById: {
    value: function(id) {
      var nodeList = new NodeList(this.ownerDocument);
      this._walk({
        enterElement: function(element) {
          if (element.id === id) {
            nodeList.push(element);
          }
          return true;
        }
      });
      return nodeList.length > 0 ? nodeList[0] : null;
    }
  },

  getElementsByTagName: {
    value: function(name) {
      var nodeList = new NodeList(this.ownerDocument);
      this._walk({
        enterElement: function(element) {
          if (element.name === name) {
            nodeList.push(element);
          }
          return true;
        }
      });
      return nodeList;
    }
  },

  cloneNode: {
    value: function(deep) {
      var clone = new Element(this.name, this.ownerDocument);

      this.attributes.forEach(function(child) {
        clone.setAttributeNode(child.cloneNode(deep));
      });

      if (deep) {
        for (var i = 0; i < this.childNodes.length; i++) {
          clone.appendChild(this.childNodes[i].cloneNode(deep));
        }
      }

      return clone;
    }
  },

  removeChild: {
    value: function(node) {
      return this.childNodes._removeChild(node);
    }
  },

  insertBefore: {
    value: function(newChild, reference) {
      return this.childNodes._insertBefore(newChild, reference);
    }
  },

  addEventListener: {
    value: function() {
      throw new Error('Not supported in server side DOM');
    }
  },

  outerHTML: {
    get: function() {
      return this._stringify();
    }
  },

  innerHTML: {
    get: function() {
      return this.childNodes._stringify();
    },

    set: function(data) {
      // Clear the current contents
      this.childNodes = new NodeList(this.ownerDocument);
      this.childNodes.parentNode = this;

      this.ownerDocument._appendHTML(data, this);
    }
  },

  innerText: {
    get: function() {
      return this.childNodes.innerText;
    }
  },

  _stringify: {
    value: function() {
      return '<' + this.name + this.attributes._stringify() + '>' +
        this.childNodes._stringify() +
        '</' + this.name + '>';
    }
  },

  _walk: {
    value: function(visitor) {
      var recurse = true;
      if (visitor.enterElement) {
        recurse = visitor.enterElement(this);
      }
      if (recurse) {
        for (var i = 0; i < this.childNodes.length; i++) {
          var node = this.childNodes[i];
          switch (node.nodeType) {
            case Node.ELEMENT_NODE:
              node._walk(visitor);
              break;

            case Node.TEXT_NODE:
              if (visitor.visitText) {
                visitor.visitText(node);
              }
              break;

            case Node.COMMENT_NODE:
              if (visitor.visitComment) {
                visitor.visitComment(node);
              }
              break;

            case Node.DOCUMENT_NODE:
              if (visitor.visitDocument) {
                visitor.visitDocument(node);
              }
              break;

            case Node.ATTRIBUTE_NODE:
            case Node.CDATA_SECTION_NODE:
            case Node.ENTITY_REFERENCE_NODE:
            case Node.ENTITY_NODE:
            case Node.PROCESSING_INSTRUCTION_NODE:
            case Node.DOCUMENT_TYPE_NODE:
            case Node.DOCUMENT_FRAGMENT_NODE:
            case Node.NOTATION_NODE:
              throw new Error('Unsupported node type ' + node.nodeType);
          }
        }
      }
      if (visitor.leaveElement) {
        visitor.leaveElement(this);
      }
    }
  }
});

/**
 * Pretend to be a W3C DOM NamedNodeMap
 */
function Attr(name, value, ownerDocument) {
  this.name = name;
  this.value = value;
  this.ownerDocument = ownerDocument;

  this.parentNode = null;
  // XML DOMs allow id's to be called something other than id. Not us.
  this.isId = (name === 'id');

  this._debug = this.toString();
};

Object.defineProperties(Attr.prototype, {

  ownerElement: { get: function() { return this.parentNode; } },
  nodeType: { value: Node.ATTRIBUTE_NODE },

  toString: {
    value: function() {
      return 'Attr(' + this._stringify() + ')';
    }
  },

  cloneNode: {
    value: function(deep) {
      return new Attr(this.name, this.value, this.ownerDocument);
    }
  },

  _stringify: {
    value: function() {
      return ' ' + this.name + '="' + this.value + '"';
    }
  }
});

/**
 * Pretend to be a W3C DOM Element
 */
function NodeList(ownerDocument) {
  this.ownerDocument = ownerDocument;

  this.parentNode = null;

  this._debug = this.toString();
};

NodeList.prototype = [];

Object.defineProperties(NodeList.prototype, {

  toString: {
    value: function() {
      return 'NodeList(' + this.length + ')';
    }
  },

  cloneNode: {
    value: function(deep) {
      var clone = new NodeList(this.ownerDocument);
      if (deep) {
        for (var i = 0; i < this.length; i++) {
          clone.appendChild(this[i].cloneNode(deep));
        }
      }
      return clone;
    }
  },

  appendChild: {
    value: function(child) {
      if (child.parentNode) {
        child.parentNode.removeChild(child);
      }
      this.push(child);
      child.parentNode = this.parentNode;

      this._debug = this.toString();
      return child;
    }
  },

  _removeChild: {
    value: function(node) {

      for (var i = 0; i < this.length; i++) {
        var child = this[i];
        if (child === node) {
          this.splice(i, 1);

          this._debug = this.toString();
          node.parentNode = null;
          return node;
        }
      }

      console.log('Members:');
      for (var i = 0; i < this.length; i++) {
        console.log('- ' + i + ' ' + this[i]);
      }

      throw new Error('node not found: ' + node + ' in ' + this);
    }
  },

  _insertBefore: {
    value: function(newChild, reference) {
      if (reference === null) {
        return this.appendChild(reference);
      }

      for (var i = 0; i < this.length; i++) {
        var compare = this[i];
        if (compare === reference) {
          if (newChild.parentNode) {
            newChild.parentNode.removeChild(newChild);
          }
          this.splice(i, 0, newChild);
          newChild.parentNode = this.parentNode;

          this._debug = this.toString();
          return newChild;
        }
      }

      throw new Error('reference not found: ' + reference + ' in ' + this);
    }
  },

  item: {
    value: function(index) {
      return this[index];
    }
  },

  _stringify: {
    value: function() {
      var reply = '';
      for (var i = 0; i < this.length; i++) {
        reply += this[i]._stringify();
      };
      return reply;
    }
  }
});

/**
 * Pretend to be a W3C DOM NamedNodeMap.
 * Generally a contaner for Attrs
 */
function NamedNodeMap(ownerDocument) {
  this.ownerDocument = ownerDocument;

  this.parentNode = null;

  this._debug = this.toString();
};

NamedNodeMap.prototype = [];

Object.defineProperties(NamedNodeMap.prototype, {

  toString: {
    value: function() {
      return 'NamedNodeMap(' + this.length + ')';
    }
  },

  appendChild: {
    value: function(child) {
      this.setNamedItem(child);
    }
  },

  cloneNode: {
    value: function(deep) {
      var clone = new NamedNodeMap(this.ownerDocument);
      this.forEach(function(child) {
        clone.setNamedItem(child.cloneNode(deep));
      });
      return clone;
    }
  },

  /**
   * Gets a node by name
   */
  getNamedItem: {
    value: function(name) {
      for (var i = 0; i < this.length; i++) {
        if (name === this[i].name) {
          return this[i];
        }
      }
      return undefined;
    }
  },

  /**
   * Adds (or replaces) a node by its nodeName
   */
  setNamedItem: {
    value: function(node) {
      for (var i = 0; i < this.length; i++) {
        if (node.name === this[i].name) {
          this[i] = node;

          this._debug = this.toString();
          return;
        }
      }
      this.push(node);
      node.parentNode = this.parentNode;
    }
  },

  /**
   * Removes a node (or if an attribute, may reveal a default if present)
   */
  removeNamedItem: {
    value: function(name) {
      for (var i = 0; i < this.length; i++) {
        if (name === this[i].name) {
          var deleted = this[i];
          this.splice(i, 1);

          this._debug = this.toString();
          return deleted;
        }
      }

      return undefined;
    }
  },

  /**
   * Returns the item at the given index (or null if the index is higher or
   * equal to the number of nodes)
   */
  item: {
    value: function(idx) {
      return this[idx];
    }
  },

  /**
   * Gets a node by namespace and localName
   */
  getNamedItemNS: {
    value: function(namespaceURI, localName) {
      throw new Error('not implemented');
    }
  },

  /**
   * Adds (or replaces) a node by its localName and namespaceURI
   */
  setNamedItemNS: {
    value: function(node) {
      throw new Error('not implemented');
    }
  },

  /**
   * Removes a node (or if an attribute, may reveal a default if present)
   */
  removeNamedItemNS: {
    value: function(namespaceURI, localName) {
      throw new Error('not implemented');
    }
  },

  _stringify: {
    value: function() {
      var reply = '';
      for (var i = 0; i < this.length; i++) {
        reply += this[i]._stringify();
      }
      return reply;
    }
  }
});

exports.Node = Node;
exports.Document = Document;
exports.DocumentType = DocumentType;
exports.Text = Text;
exports.Comment = Comment;
exports.Element = Element;
exports.Attr = Attr;
exports.NodeList = NodeList;
exports.NamedNodeMap = NamedNodeMap;
