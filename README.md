
About ServerDOM
===============

**Version**: 0.1 (21 September 2010)  
**Author**: Joe Walker [ joe at getahead dot org ]  
**License**: Apache v2  

ServerDOM is an implementation of the DOM in JavaScript that lives on the server
rather than in the browser. ServerDOM uses tautologistics
[node-htmlparser](http://github.com/tautologistics/node-htmlparser) to do the
nasty work of HTML parsing.


Why?
----

Server-side JavaScript brings with it the promise of being able to share logic
between the client and the server. It's nice to be able to write your code only
once.

However this is tricky with presentation logic, which often requires a DOM to
work against. Enter ServerDOM to provide a minimalist browser environment so
you can do progressive enhancement type things without writing everything twice.


How good is it?
---------------

Just good enough for my needs at the moment, which is to say, very probably
not good enough for yours. It's a good way to covering most of the obvious stuff
but it's a long way from being a full browser mock-up.


How long before it's complete?
------------------------------

It's probably not possible to write a full mock browser in pure JavaScript.
For example, several browsers have a fake document.all that appears to not
exist until you use it, and then it magically works

    if (!document.all) { console.log('missing all'); } // missing all
    console.log(document.all.someId);                  // debugs an element

Maybe there's a smart way of doing this, but the point remains, trying to
replicate the full browser in pure JavaScript is probably a fools errand.


Doesn't that render ServerDOM pointless?
----------------------------------------

It means that you probably can't use ServerDOM to do unit tests. We can't hope
to mock the full insanity of the browser environment, but we can use it for the
more idealistic world of replicating mailable view logic. That is to say, if you
have some presentation logic that uses the mad document.all behaviour (*) then
you can still use ServerDOM, but by fixing your script.

(* I know why document.all behaves the way it does - sometimes it pays to
pretend to be mad if you're dealing with someone that expects insanity - however
that doesn't make the behaviour sane, only justifiably insane ;-)


What is the Roadmap?
--------------------

If there's not much interest, the the roadmap ends here, because it's currently
good enough for me, but if people like it then we can probably sort out some
releases like "Supports JQuery v1.4", "Supports DOM levels 0-3" and so on. I
will be relying on help making it better though.


How do I get started?
---------------------

* Install [Node](http://nodejs.org/)
* Install and use ServerDOM:

    $ git clone git@github.com:joewalker/serverdom.git
    Initialized empty Git repository in /.../serverdom/.git/
    [blah blah]
    $ cd serverdom
    $ git clone http://github.com/tautologistics/node-htmlparser.git
    Initialized empty Git repository in /.../serverdom/node-htmlparser/.git/
    $ node test/domtest.js
    completed
    $ cat test/domtest.js
    "I see! It works like a browser DOM, but you start with 'new Document(...)'"

To check that dom/js works in the same way as the browser, just load
`test/test.html` into your browser. It will run the test suite against the a
real DOM. The results should be the same.

Comments, complaints, etc: [ joe at getahead dot org ]
