[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v1.4%20adopted-ff69b4.svg)](code-of-conduct.md)

# Looqbox Editor

Looqbox editor is a code editor based in javascript. It uses [Prism](https://prismjs.com/index.html) for highlight syntax and it is [CSP](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CSP) **compliant**, which makes it a really good option since almost all other open source code editors don't work well when CSP directives are enabled.

## Embedding the editor

The editor can be easily embedded in your application. That can be done in two ways: using Node or downloading de source files.

### Installing with Node

First, run:
```
npm install looq-editor
```
Then, in your js file, add:
```js
var looqEditor = require('looq-editor/dist/js/editor.js').default;
var css = require('looq-editor/dist/css/editor.css');
```
Or, if you use ES6 syntax:
```css
import looqEditor from 'looq-editor/dist/js/editor.js';
import css from 'looq-editor/dist/css/editor.css';
```

### Downloading files

If you don't use node, you can download all files inside the [resources](resources) folder

Then, in your html, include:
```html
<link type="text/css" rel="stylesheet" href="resources/prism/prism.css">
```
```html
<link type="text/css" rel="stylesheet" href="resources/css/editor.css">
```
```html
<script type="text/javascript" src="resources/prism/prism.js"></script>
```
```html
<script type="text/javascript" src="resources/js/editor.js"></script>
```

## Basic Usage

#### If you installed as a npm package
In your html, create a container for the editor
```html
<div id='myCustomId'></div>
```
Customize it with the css you want:
```css
#myCustomId {
  width: 800px;
}
```
Then, instantiate a new editor using the selector you want:
```js
var myEditor = new looqEditor('#myCustomId');
```

#### If you included the files
Create a container in your html, with the id **looq-editor**:
```html
<div id='looq-editor'></div>
```
This will automatically make the editor available in your application. 

Then, customize the container:
```css
#looq-editor {
  width: 800px;
}
```
## Configuring Prism
By default, looq editor downloads the entire bundle that comes along with Prism. Since this package includes a lot of plugins, themes and highlight configurations for over 200 languages, it can be heavy. You can choose to install Prism as a standard module and specify what languages, plugins, and themes you want.

- If you use babel, you may check out [babel-plugin-prismjs](https://www.npmjs.com/package/babel-plugin-prismjs).
- Other option is to navigate to [Prism custom download page](https://prismjs.com/download.html#themes=prism&plugins=line-numbers) and select the options you want.
  <br>`Note:` If you download new prism files, remember to include the new files

**While configurating plugins and themes, take the following into account:**

- Currently, the only supported theme is the Default one
- The following plugins are supported:
  - Line Numbers
