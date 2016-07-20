'use strict';

var createMailer = require('strider-mailer');
var jobHandler = require('./lib/handler');

module.exports = {
  config: {
    alwaysNotify: {
      type: Boolean,
      default: false
    }
  },
  // global events
  listen: function (io, context) {
    io.on('plugin.emailNotifier.send', function (jobId, pluginConfig) {
      function onDoneAndSaved(job) {
        if (job._id.toString() === jobId.toString()) {
          context.pluginConfig = pluginConfig;
          context.createMailer = createMailer;

          io.removeListener('job.doneAndSaved', onDoneAndSaved);
          jobHandler(job, context);
        }
      }

      io.on('job.doneAndSaved', onDoneAndSaved);
    });
  }
};
