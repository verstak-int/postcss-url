'use strict';

const fs = require('fs');
const path = require('path');

const getFileInBasePath = (from, basePath, pathname) => {
    const fullFilePath = path.join(basePath, pathname);
    const file = path.resolve(from, fullFilePath);

    if (fs.existsSync(file)) return file;
};

const findFile = (dir, link, basePath, log) => {
    let filePath;

    basePath = basePath || (dir.file !== dir.from ? dir.file : '');

    Array.prototype.concat.call([], basePath)
        .forEach((basePathItem) => {
            filePath = getFileInBasePath(dir.from, basePathItem, link.pathname);

            if (filePath) return false;
        });

    if (!filePath) {
        log.warn(`Can't read file '${filePath}', ignoring`);

        return;
    }

    return {
        path: filePath,
        contents: fs.readFileSync(filePath)
    };
};

module.exports = findFile;
