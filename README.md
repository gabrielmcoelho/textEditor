[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v1.4%20adopted-ff69b4.svg)](code-of-conduct.md)

# Looqbox Editor

Looqbox editor is a code editor based in javascript. It uses Prism for highlight syntax and it is **CSP compliant**, which makes it a really good option since almost all other open source code editors don't work well when CSP is enabled. The editor can be easily embedded in your application, only requiring you to set up some prism configurations.

## Embedding the editor

To start using the editor in your application, first make sure you have jquery in your dependencies. Then, you need to configure Prism and download the configuration file after.

### Prism configuration

1. Go to https://prismjs.com/download.html#themes=prism
2. Select the configuration you want, taking into account the following:
- Currently, the only supported theme is the Default one
- You can choose as many languages you want, as long as you include them in the **languageOptions** variable later
- Currently, the supported plugins are:
  - Line Numbers
