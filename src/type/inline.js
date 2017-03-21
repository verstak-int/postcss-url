'use strict';

const url = require('url');
const fs = require('fs');
const mime = require('mime');
const encodeFile = require('../encode-file');

const processCopy = require('./copy');
const findFile = require('../findFile');

/**
 * @param {String} originUrl
 * @param {PostcssUrl~Dirs} dir
 * @param {PostcssUrl~Option} options
 *
 * @returns {String|Undefined}
 */
function processFallback(originUrl, dir, options) {
    if (typeof options.fallback === 'function') {
        return options.fallback.apply(null, arguments);
    }
    switch (options.fallback) {
        case 'copy':
            return processCopy.apply(null, arguments);
        default:
            return;
    }
}

/**
 * Inline image in url()
 *
 * @type {PostcssUrl~UrlProcessor}
 * @param {String} originUrl
 * @param {PostcssUrl~Dirs} dir
 * @param {PostcssUrl~Option} options
 * @param {PostscssUrl~Log} log
 *
 * @returns {String|Undefined}
 */
module.exports = function(originUrl, dir, options, log) {
    const maxSize = (options.maxSize || 0) * 1024;
    const encodeType = options.encodeType || 'base64';

    const link = url.parse(originUrl);
    const file = findFile(dir, link, options.basePath, log);

    if (!file) return;

    if (maxSize) {
        const stats = fs.statSync(file.path);

        return stats.size >= maxSize && processFallback.apply(this, arguments);
    }

    const mimeType = mime.lookup(file.path);

    // Warn for svg with hashes/fragments
    if (link.hash && mimeType === 'image/svg+xml') {
        log.warn(
        // eslint-disable-next-line max-len
          `Image type is svg and link contains #. Postcss-url cant handle svg fragments. SVG file fully inlined. ${file.path}`
        );
    }

    if (!mimeType) {
        log.warn(`Unable to find asset mime-type for ${file.path}`);

        return;
    }

    const encodedStr = encodeFile(file.contents, mimeType, encodeType);

    return link.hash ? encodedStr + link.hash : encodedStr;
};
