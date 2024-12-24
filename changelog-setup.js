module.exports = function (Handlebars) {
  Handlebars.registerHelper('full-commit-list', (commits, merges, fixes, options) => {
    commits = commits
      .concat(merges.map((merge) => merge.commit))
      .concat(fixes.map((fix) => fix.commit));

    if (!commits || commits.length === 0) {
      return '';
    }

    const { exclude, message, subject, heading } = options.hash;

    const list = commits
      .filter((item) => {
        const commit = item.commit || item;

        // Exclude commits where subject includes with "Release v"
        if (commit.subject.includes('Release v')) {
          return false;
        }

        if (exclude) {
          const excludeList = exclude.split('|');
          for (const e of excludeList) {
            const pattern = new RegExp(e, 'm');
            // Test against subject instead of full message for exclusions
            if (pattern.test(commit.subject)) {
              return false;
            }
          }
        }
        if (message) {
          const pattern = new RegExp(message, 'm');
          return pattern.test(commit.message);
        }
        if (subject) {
          const pattern = new RegExp(subject);
          const match = pattern.test(commit.subject);
          if (match) {
            // remove the message from the commit subject and message and trim
            commit.subject = commit.subject.replace(pattern, '').trim();
          }
          return match;
        }
        return true;
      })
      .map((item) => options.fn(item))
      .join('');

    if (!list) {
      return '';
    }

    if (!heading) {
      return list;
    }

    return `${heading}\n\n${list}`;
  });
};
