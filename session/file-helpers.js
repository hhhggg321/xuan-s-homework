var fs = require('fs-extra');
var writeFileAtomic = require('write-file-atomic');
var path = require('path');
var retry = require('retry');
var crypto = require('crypto');

var helpers = {

  encAlgorithm: 'aes-256-ctr',

  sessionPath: function (basepath, sessionId) {
    return path.join(basepath, sessionId + '.json');
  },

  sessionId: function (file) {
    return file.substring(0, file.lastIndexOf('.json'));
  },

  getLastAccess: function (session) {
    return session.__lastAccess;
  },

  setLastAccess: function (session) {
    session.__lastAccess = new Date().getTime();
  },

  defaults: function (options) {
    options = options || {};

    var NOOP_FN = function () {
    };

    return {
      path: path.normalize(options.path || './sessions'),
      ttl: options.ttl || 3600,
      retries: options.retries || 5,
      factor: options.factor || 1,
      minTimeout: options.minTimeout || 50,
      maxTimeout: options.maxTimeout || 100,
      filePattern: /\.json$/,
      logFn: options.logFn || console.log || NOOP_FN,
      fallbackSessionFn: options.fallbackSessionFn,
      encrypt: options.encrypt || false
    };
  },

  // Attempts to fetch session from a session file by the given `sessionId`
  get: function (sessionId, options, callback) {
    var sessionPath = helpers.sessionPath(options.path, sessionId);

    var operation = retry.operation({
      retries: options.retries,
      factor: options.factor,
      minTimeout: options.minTimeout,
      maxTimeout: options.maxTimeout
    });

    operation.attempt(function () {
      fs.readFile(sessionPath, 'utf8', function (err, data) {

        if (!err) {
          var json;
          try {
            json = JSON.parse(options.encrypt ? helpers.decrypt(data, sessionId) : data);
          } catch (err2) {
            err = err2;
          }
          if (!err) {
            return callback(null, helpers.isExpired(json, options) ? null : json);
          }
        }

        if (operation.retry(err)) {
          options.logFn('[my-file-store] will retry, error on last attempt: ' + err);
        } else if (options.fallbackSessionFn) {
          var session = options.fallbackSessionFn(sessionId);
          helpers.setLastAccess(session);
          callback(null, session);
        } else {
          callback(err);
        }
      });
    });
  },

  // Attempts to commit the given `session` associated with the given `sessionId` to a session file

  set: function (sessionId, session, options, callback) {
    try {
      helpers.setLastAccess(session);

      var sessionPath = helpers.sessionPath(options.path, sessionId);
      var json = JSON.stringify(session);
      if (options.encrypt) {
        json = helpers.encrypt(json, sessionId)
      }
      writeFileAtomic(sessionPath, json, function (err) {
        if (callback) {
          err ? callback(err) : callback(null, session);
        }
      });
    } catch (err) {
      if (callback) callback(err);
    }
  },

    // Attempts to unlink a given session by its id

  destroy: function (sessionId, options, callback) {
    var sessionPath = helpers.sessionPath(options.path, sessionId);
    fs.remove(sessionPath, callback);
  },

  //  Attempts to fetch number of the session files

  length: function (options, callback) {
    fs.readdir(options.path, function (err, files) {
      if (err) return callback(err);

      var result = 0;
      files.forEach(function (file) {
        if (options.filePattern.exec(file)) {
          ++result;
        }
      });

      callback(null, result);
    });
  },

  // Attempts to clear out all of the existing session files
  clear: function (options, callback) {
    fs.readdir(options.path, function (err, files) {
      if (err) return callback([err]);
      if (files.length <= 0) return callback();

      var errors = [];
      files.forEach(function (file, i) {
        if (options.filePattern.exec(file)) {
          fs.remove(path.join(options.path, file), function (err) {
            if (err) {
              errors.push(err);
            }
            // TODO: wrong call condition (call after all completed attempts to remove instead of after completed attempt with last index)
            if (i >= files.length - 1) {
              errors.length > 0 ? callback(errors) : callback();
            }
          });
        } else {
          // TODO: wrong call condition (call after all completed attempts to remove instead of after completed attempt with last index)
          if (i >= files.length - 1) {
            errors.length > 0 ? callback(errors) : callback();
          }
        }
      });
    });
  },

    // Attempts to find all of the session files
  list: function (options, callback) {
    fs.readdir(options.path, function (err, files) {
      if (err) return callback(err);

      files = files.filter(function (file) {
        return options.filePattern.exec(file);
      });

      callback(null, files);
    });
  },

  //  Attempts to detect whether a session file is already expired or not
  expired: function (sessionId, options, callback) {
    helpers.get(sessionId, options, function (err, session) {
      if (err) return callback(err);

      err ? callback(err) : callback(null, helpers.isExpired(session, options));
    });
  },

  isExpired: function (session, options) {
    if (!session) return true;

    var ttl = session.cookie && session.cookie.originalMaxAge ? session.cookie.originalMaxAge : options.ttl * 1000;
    return !ttl || helpers.getLastAccess(session) + ttl < new Date().getTime();
  },

  encrypt: function (text, sessionId) {
    var cipher = crypto.createCipher(helpers.encAlgorithm, sessionId);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  },

  decrypt: function (text, sessionId) {
    var decipher = crypto.createDecipher(helpers.encAlgorithm, sessionId);
    var dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  }
};

module.exports = helpers;
