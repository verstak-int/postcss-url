'use strict';

const path = require('path');
const url = require('url');
const fs = require('fs');
const pathIsAbsolute = require('path-is-absolute');
const mkdirp = require('mkdirp');

const calcHash = require('../calc-hash');
const findFile = require('../findFile');

const defaultHashOptions = {
    method: 'xxhash32',
    shrink: 8
};

const filePathSubtract = (file, from) => {
    if (!pathIsAbsolute.posix(from)) {
        from = path.resolve(from);
    }
    // escaping from
    const fromEscaped = new RegExp(`${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\/]\?`);

    return file.replace(fromEscaped, '');
};

/**
 * Copy images from readed from url() to an specific assets destination
 * (`assetsPath`) and fix url() according to that path.
 * You can rename the assets by a hash or keep the real filename.
 *
 * Option assetsPath is require and is relative to the css destination (`to`)
 *
 * @type {PostcssUrl~UrlProcessor}
 * @param {String} originUrl
 * @param {PostcssUrl~Dirs} dir
 * @param {PostcssUrl~Option} options
 * @param {PostscssUrl~Log} log
 *
 * @returns {String|Undefined}
 */
module.exports = function processCopy(originUrl, dir, options, log) {
    if (!options.assetsPath && dir.from === dir.to) {
        log.warn('Option `to` of postcss is required, ignoring');

        return;
    }

    const link = url.parse(originUrl);
    const file = findFile(dir, link, options.basePath, log);

    if (!file) return;

    const hashOptions = options.hashOptions || defaultHashOptions;
    const name = options.useHash
        ? calcHash(file.contents, hashOptions) + path.extname(file.path)
        : path.basename(file.path);

    let relativeAssetsPath = options.assetsPath ? options.assetsPath : '';

    // calc relative path if not use hash naming
    if (!options.useHash) {
        relativeAssetsPath = path.join(
            relativeAssetsPath,
            filePathSubtract(dir.file, dir.from),
            path.dirname(originUrl)
        );
    }

    const absoluteAssetsDir = path.resolve(dir.to, relativeAssetsPath);
    const absoluteAssetPath = path.join(absoluteAssetsDir, name);

    mkdirp.sync(absoluteAssetsDir);

    // if the file don't exist in the destination, create it.
    try {
        fs.accessSync(absoluteAssetPath);
    } catch (err) {
        fs.writeFileSync(absoluteAssetPath, file.contents);
    }

    let assetPath = path.join(
        relativeAssetsPath,
        name + (link.search || '') + (link.hash || '')
    );

    assetPath = path.normalize(assetPath);

    if (path.sep === '\\') {
        assetPath = assetPath.replace(/\\/g, '\/');
    }

    return assetPath;
};
