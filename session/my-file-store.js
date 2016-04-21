var helpers = require('./file-helpers');
var fs = require('fs-extra');

module.exports = function (session) {
  var Store = session.Store;
  function FileStore(path, options) {
    var self = this;
    options = options || {};
    options.path = path;
    Store.call(self, options);
    self.options = helpers.defaults(options);
    //check if the session directory exists
    fs.exists(self.options.path, function(exists) {
    if (!exists) {
      fs.mkdirsSync(self.options.path);
    }
    });
  }

  FileStore.prototype.__proto__ = Store.prototype;

  FileStore.prototype.all = function (callback) {
    helpers.list(this.options, callback);
  };

  FileStore.prototype.destroy = function (sessionId, callback) {
    helpers.destroy(sessionId, this.options, callback);
  };

  FileStore.prototype.clear = function (callback) {
    helpers.clear(this.options, callback);
  };

  FileStore.prototype.length = function (callback) {
    helpers.length(this.options, callback);
  };

  FileStore.prototype.get = function (sessionId, callback) {
    helpers.get(sessionId, this.options, callback);
  };

  FileStore.prototype.set = function (sessionId, session, callback) {
    helpers.set(sessionId, session, this.options, callback);
  };

  FileStore.prototype.touch = function (sessionId, session, callback) {
    helpers.set(sessionId, session, this.options, callback);
  };

  FileStore.prototype.expired = function (sessionId, callback) {
    helpers.expired(sessionId, this.options, callback);
  };

  return FileStore;
};
