/**
 * Transform url() based on a custom callback
 *
 * @type {PostcssUrl~UrlProcessor}
 * @param {String} url
 * @param {PostcssUrl~Dirs} dir
 * @param {PostcssUrl~Option} options
 * @param {PostscssUrl~Log} log
 *
 * @returns {String|Undefined}
 */
module.exports = function getCustomProcessor(url, dir, options) {
    return options.url.apply(null, arguments);
};
