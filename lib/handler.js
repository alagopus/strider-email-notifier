'use strict';

var async = require('async');
var createMailer = require('./mailer');

module.exports = function (job, context, callback) {

  context.pluginConfig = context.pluginConfig || {};

  var branch = job.ref && job.ref.branch ? job.ref.branch : 'master';

  async.waterfall(
    [
      function (waterCallback) {
        var query = {project: job.project.name, 'ref.branch': branch};
        var options = {sort: {finished: -1}, limit: 2};
        context.models.Job.find(query, null, options, function (error, jobs) {
          var previousJob = jobs && jobs.length > 1 && jobs[1] ? jobs[1] : false;
          if (previousJob) {
            previousJob.success = determineSuccess(previousJob);
          }
          waterCallback(error, job, previousJob);
        });
      }
    ],
    function (error, job, previousJob) {
      if (error) {
        throw error;
      }

      job.success = determineSuccess(job);

      var pluginConfig = context.pluginConfig;
      var sendEmail = createMailer(context);

      // Send email if this is the first ever job for this project, or if the build was a failure,
      // or if the previous build was a failure (first success) or if always notify is set for this project

      if (shouldEmail(pluginConfig.notify, job, previousJob)) {
        sendEmail(job, callback);
      } else {
        if (callback) callback(null, {state: 'didNotSend'});
      }
    }
  );
};

function determineSuccess(job) {
  return job.test_exitcode === 0;
}

function shouldEmail(config, currentJob, previousJob) {
  return !previousJob ||
    {
      'on-change': currentJob.success !== previousJob.success,
      'always': true,
      'noisy-fail': !currentJob.success || !previousJob.success
    }[config || 'noisy-fail'];
}
