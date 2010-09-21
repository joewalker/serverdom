
if (!this.document) {
    // We're running in node
    this.document = null;

    var Document = require('../lib/dom').Document;
    var Node = require('../lib/dom').Node;
    var htmlparser = require('../node-htmlparser/lib/node-htmlparser');
    var fs = require('fs');

    fs.readFile('test/test.html', function(error, data) {
        if (error) {
            console.error(error);
        } else {
            document = new Document(data.toString());
            test();
        }
    });
} else {
    test();
}

function test() {
    var inner = '<div id="outer"><div id="one">One</div><div id="two">Two</div></div>';

    document.body.innerHTML = inner;
    var outer = document.getElementById('outer');
    var one = document.getElementById('one');
    var two = document.getElementById('two');

    verifyEqual(Node.DOCUMENT_NODE, document.nodeType);

    verifyEqual('one', one.id);
    verifyNull(document.getElementById('three'));

    verifyEqual(3, document.getElementsByTagName('div').length);
    verifyEqual(0, document.getElementsByTagName('span').length);
    // verifyNull(document.getElementsByTagName('div').parentNode);

    verifyEqual(Node.ELEMENT_NODE, document.createElement('p').nodeType);

    verifyEqual('', document.createElement('outer').textContent);
    verifyEqual('One', one.textContent);
    verifyEqual('Two', two.textContent);

    verifyEqual(Node.TEXT_NODE, document.createTextNode('Hello1').nodeType);
    verifyEqual('Hello4', document.createTextNode('Hello4').data);
    verifyEqual(Node.COMMENT_NODE, document.createComment('World1').nodeType);
    verifyEqual('World2', document.createComment('World2').data);

    verifyEqual(document.body.innerHTML, inner);

    var span = document.createElement('span');
    verifyNull(span.getAttribute('id'));
    verifyNull(span.parentNode);
    span.id = 'free';
    verifyEqual('free', span.getAttribute('id'));
    span.appendChild(document.createTextNode('Three'));
    span.setAttribute('id', 'three');
    verifyEqual('three', span.getAttribute('id'));
    verifyEqual('three', span.getAttributeNode('id').value);
    verifyEqual(Node.ATTRIBUTE_NODE, span.getAttributeNode('id').nodeType);

    verifyTrue(span.hasAttribute('id'));

    verifyFalse(span.hasAttribute('CLAZZ'));
    span.setAttribute('CLAZZ', '');
    verifyTrue(span.hasAttribute('CLAZZ'));
    verifyUndefined(span.removeAttribute('CLAZZ'));
    verifyFalse(span.hasAttribute('CLAZZ'));
    verifyNull(span.getAttribute('CLAZZ'));

    outer.appendChild(span);
    assertSame(outer, span.parentNode);
    verifyEqual(document.body.innerHTML, '<div id="outer"><div id="one">One</div><div id="two">Two</div><span id="three">Three</span></div>');

    var removed = outer.removeChild(span);
    assertSame(removed, span);
    verifyNull(span.parentNode);
    verifyEqual(document.body.innerHTML, inner);

    outer.insertBefore(span, two);
    assertSame(outer, span.parentNode);
    verifyEqual(document.body.innerHTML, '<div id="outer"><div id="one">One</div><span id="three">Three</span><div id="two">Two</div></div>');

    outer.removeChild(span);
    verifyEqual(document.body.innerHTML, inner);

    var reference = [ one, two ];
    verifyEqual(reference.length, outer.childNodes.length);
    for (var i = 0; i < outer.childNodes.length; i++) {
        verifySame(outer.childNodes[i], reference[i]);
        verifySame(outer.childNodes.item(i), reference[i]);

        verifySame(outer.childNodes[i].parentNode, outer);
    }

    verifyEqual(0, outer.cloneNode(false).childNodes.length);
    verifyNull(outer.cloneNode(false).parentNode);

    verifyEqual(2, outer.cloneNode(true).childNodes.length);
    verifyNull(outer.cloneNode(true).parentNode);

    console.log('completed');
}




// TODO: Use a more professional unit test environment

function fail(message) {
  _recordThrow("fail", arguments);
}

function assertTrue(value) {
  if (!value) {
    _recordThrow("assertTrue", arguments);
  }
}

function verifyTrue(value) {
  if (!value) {
    _recordTrace("verifyTrue", arguments);
  }
}

function assertFalse(value) {
  if (value) {
    _recordThrow("assertFalse", arguments);
  }
}

function verifyFalse(value) {
  if (value) {
    _recordTrace("verifyFalse", arguments);
  }
}

function assertNull(value) {
  if (value !== null) {
    _recordThrow("assertNull", arguments);
  }
}

function verifyNull(value) {
  if (value !== null) {
    _recordTrace("verifyNull", arguments);
  }
}

function assertNotNull(value) {
  if (value === null) {
    _recordThrow("assertNotNull", arguments);
  }
}

function verifyNotNull(value) {
  if (value === null) {
    _recordTrace("verifyNotNull", arguments);
  }
}

function assertUndefined(value) {
  if (value !== undefined) {
    _recordThrow("assertUndefined", arguments);
  }
}

function verifyUndefined(value) {
  if (value !== undefined) {
    _recordTrace("verifyUndefined", arguments);
  }
}

function assertNotUndefined(value) {
  if (value === undefined) {
    _recordThrow("assertNotUndefined", arguments);
  }
}

function verifyNotUndefined(value) {
  if (value === undefined) {
    _recordTrace("verifyNotUndefined", arguments);
  }
}

function assertNaN(value) {
  if (!isNaN(value)) {
    _recordThrow("assertNaN", arguments);
  }
}

function verifyNaN(value) {
  if (!isNaN(value)) {
    _recordTrace("verifyNaN", arguments);
  }
}

function assertNotNaN(value) {
  if (isNaN(value)) {
    _recordThrow("assertNotNaN", arguments);
  }
}

function verifyNotNaN(value) {
  if (isNaN(value)) {
    _recordTrace("verifyNotNaN", arguments);
  }
}

function assertEqual(expected, actual) {
  if (!_isEqual(expected, actual)) {
    _recordThrow("assertEqual", arguments);
  }
}

function verifyEqual(expected, actual) {
  if (!_isEqual(expected, actual)) {
    _recordTrace("verifyEqual", arguments);
  }
}

function assertNotEqual(expected, actual) {
  if (_isEqual(expected, actual)) {
    _recordThrow("assertNotEqual", arguments);
  }
}

function verifyNotEqual(expected, actual) {
  if (!_isEqual(expected, actual)) {
    _recordTrace("verifyNotEqual", arguments);
  }
}

function assertSame(expected, actual) {
  if (expected !== actual) {
    _recordThrow("assertSame", arguments);
  }
}

function verifySame(expected, actual) {
  if (expected !== actual) {
    _recordTrace("verifySame", arguments);
  }
}

function assertNotSame(expected, actual) {
  if (expected !== actual) {
    _recordThrow("assertNotSame", arguments);
  }
}

function verifyNotSame(expected, actual) {
  if (expected !== actual) {
    _recordTrace("verifyNotSame", arguments);
  }
}

function _recordTrace() {
  _record.apply(this, arguments);
  console.trace();
}

function _recordThrow() {
  _record.apply(this, arguments);
  throw new Error();
}

function success(message) {
  console.log(message);
}

function _record() {
  console.error(arguments);
  var message = arguments[0] + "(";
  var data = arguments[1];
  if (typeof data == "string") {
    message += data;
  }
  else {
    for (var i = 0; i < data.length; i++) {
      if (i != 0){message += ", ";}
      message += data[i];
    }
  }
  message += ")";
  console.log(message);
}

function _isEqual(expected, actual, depth) {
  if (!depth){depth = 0;}
  // Rather than failing we assume that it works!
  if (depth > 10) {
    return true;
  }

  if (expected == null) {
    if (actual != null) {
      console.log("expected: null, actual non-null: ", actual);
      return false;
    }
    return true;
  }

  if (typeof(expected) == "number" && isNaN(expected)) {
    if (!(typeof(actual) == "number" && isNaN(actual))) {
      console.log("expected: NaN, actual non-NaN: ", actual);
      return false;
    }
    return true;
  }

  if (actual == null) {
    if (expected != null) {
      console.log("actual: null, expected non-null: ", expected);
      return false;
    }
    return true; // we wont get here of course ...
  }

  if (typeof expected == "object") {
    if (!(typeof actual == "object")) {
      console.log("expected object, actual not an object");
      return false;
    }

    var actualLength = 0;
    for (var prop in actual) {
      if (typeof actual[prop] != "function" || typeof expected[prop] != "function") {
        var nest = _isEqual(actual[prop], expected[prop], depth + 1);
        if (typeof nest != "boolean" || !nest) {
          console.log("element '" + prop + "' does not match: " + nest);
          return false;
        }
      }
      actualLength++;
    }

    // need to check length too
    var expectedLength = 0;
    for (prop in expected) expectedLength++;
    if (actualLength != expectedLength) {
      console.log("expected object size = " + expectedLength + ", actual object size = " + actualLength);
      return false;
    }
    return true;
  }

  if (actual != expected) {
    console.log("expected = " + expected + " (type=" + typeof expected + "), actual = " + actual + " (type=" + typeof actual + ")");
    return false;
  }

  if (expected instanceof Array) {
    if (!(actual instanceof Array)) {
      console.log("expected array, actual not an array");
      return false;
    }
    if (actual.length != expected.length) {
      console.log("expected array length = " + expected.length + ", actual array length = " + actual.length);
      return false;
    }
    for (var i = 0; i < actual.length; i++) {
      var inner = _isEqual(actual[i], expected[i], depth + 1);
      if (typeof inner != "boolean" || !inner) {
        console.log("element " + i + " does not match: " + inner);
        return false;
      }
    }

    return true;
  }

  return true;
}
