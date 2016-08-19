var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var moment = require('moment');
var path = require('path');
var pug = require('pug');

module.exports = function (context) {

  var config = context.config;
  var mailer = context.createMailer(config);
  var User = context.models.User;
  var test_fail_plaintext = renderPug(path.join(__dirname, '../views', 'email_templates', 'plaintext', 'test_fail.pug'));
  var test_succeed_plaintext = renderPug(path.join(__dirname, '../views', 'email_templates', 'plaintext', 'test_succeed.pug'));
  var test_succeed_html = renderUnderscore(path.join(__dirname, '../views', 'email_templates', 'html', 'test_succeed.html'));
  var test_fail_html = renderUnderscore(path.join(__dirname, '../views', 'email_templates', 'html', 'test_fail.html'));

  function renderPug(filepath) {
    return pug.compile(fs.readFileSync(filepath, 'utf8'), {filename: filepath});
  }

  function renderUnderscore(filepath) {
    return _.template(fs.readFileSync(filepath, 'utf8'));
  }

  function getTemplateOptions(job, state, type) {
    var project = job.project;
    var display_name = project.display_name;
    var triggerType = job.trigger.type;
    var triggerMessage = job.trigger.message;
    var subject = '[STRIDER] - ' + display_name + ' (' + triggerType + ') test ' + state + ' - ' + job._id.toString().substr(0, 8);
    var duration = mailer.elapsed_time(job.started.getTime(), job.finished.getTime());
    var url = config.server_name + '/' + display_name + '/job/' + job._id;
    var branchName = job.ref && job.ref.branch ? job.ref.branch : 'branch unknown';
    var jobAuthor = job.trigger && job.trigger.author ? job.trigger.author : false;
    var authorName = jobAuthor && jobAuthor.name ? jobAuthor.name : false;
    var authorUsername = jobAuthor && jobAuthor.username ? jobAuthor.username : false;
    var authorEmail = jobAuthor && jobAuthor.email ? jobAuthor.email : '';
    var author = (authorUsername ? authorUsername : '') + (authorName ? ' (' + authorName + ')' : '');

    return {
      displayName: display_name,
      finishTime: moment(job.finished_timestamp).format('YYYY-MM-DD h:mm a'),
      elapsedTime: duration,
      url: url,
      subject: subject,
      branchName: branchName,
      author: author || authorEmail,
      logTail: mailer.format_stdmerged(job.std.merged, type),
      triggerType: triggerType,
      triggerMessage: triggerMessage
    };
  }

  function sendToCollaborators(job, htmlTemplate, plainTextTemplate, state, callback) {
    var project = job.project;
    var htmlOptions = getTemplateOptions(job, state, 'html');
    var body_html = htmlTemplate(htmlOptions);
    var body_text = plainTextTemplate(getTemplateOptions(job, state, 'plaintext'));
    var numEmailsSent = 0;

    function complete(error) {
      if (callback) {
        callback(error, {state: state + 'Sent', numEmailsSent: numEmailsSent});
      }
    }

    User.collaborators(project.name, function (err, users) {
      if (err) console.error('[email-ok] Error finding collaborators for project', err.message);
      async.each(users, function (user, eachCallback) {
        mailer.send(user.email, htmlOptions.subject, body_text, body_html, false, function (error) {
          if (!error) {
            numEmailsSent++;
          }
          eachCallback(error);
        });
      }, complete);
    });
  }

  function sendSuccess(job, callback) {
    sendToCollaborators(job, test_succeed_html, test_succeed_plaintext, 'success', callback);
  }

  function sendFailure(job, callback) {
    sendToCollaborators(job, test_fail_html, test_fail_plaintext, 'failure', callback);
  }

  function send(currentJob, callback) {
    if (parseInt(currentJob.test_exitcode, 10) === 0) {
      sendSuccess(currentJob, callback);
    } else {
      sendFailure(currentJob, callback);
    }
  }

  return send;
};
