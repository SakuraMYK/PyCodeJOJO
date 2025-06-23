const compareFunc = require("compare-func");

module.exports = {
  writerOpts: {
    transform: (commit, context) => {
      let discard = true;
      const issues = [];

      commit.notes.forEach((note) => {
        note.title = "BREAKING CHANGES";
        discard = false;
      });

      if (commit.type === "feat") {
        commit.type = "✨ 新特性";
      } else if (commit.type === "fix") {
        commit.type = "🐛 修复";
      } else if (commit.type === "perf") {
        commit.type = "🚀 性能优化";
      } else if (commit.type === "revert") {
        commit.type = "⏪ 回退";
      } else if (commit.type === "docs") {
        commit.type = "📝 文档";
      } else if (commit.type === "style") {
        commit.type = "💄 样式";
      } else if (commit.type === "refactor") {
        commit.type = "♻️ 重构";
      } else if (commit.type === "test") {
        commit.type = "✅ 测试";
      } else if (commit.type === "build") {
        commit.type = "👷 构建";
      } else if (commit.type === "ci") {
        commit.type = "🔧 CI配置";
      } else if (commit.type === "chore") {
        commit.type = "🎫 其他更新";
      } else if (discard) {
        return;
      }

      if (commit.scope === "*") {
        commit.scope = "";
      }

      if (typeof commit.hash === "string") {
        commit.hash = commit.hash.substring(0, 7);
      }

      if (typeof commit.subject === "string") {
        let url = context.repository
          ? `${context.host}/${context.owner}/${context.repository}`
          : context.repoUrl;

        if (url) {
          url = `${url}/issues/`;
          // Issue URLs.
          commit.subject = commit.subject.replace(/#([0-9]+)/g, (_, issue) => {
            issues.push(issue);
            return `[#${issue}](${url}${issue})`;
          });
        }

        if (context.host) {
          // User URLs.
          commit.subject = commit.subject.replace(
            /\B@([a-z0-9](?:-?[a-z0-9/]){0,38})/g,
            (_, username) => {
              if (username.includes("/")) {
                return `@${username}`;
              }
              return `[@${username}](${context.host}/${username})`;
            }
          );
        }
      }

      // remove references that already appear in the subject
      commit.references = commit.references.filter((reference) => {
        if (issues.indexOf(reference.issue) === -1) {
          return true;
        }
        return false;
      });

      return commit;
    },
    groupBy: "type",
    commitGroupsSort: "title",
    commitsSort: ["scope", "subject"],
    noteGroupsSort: "title",
    notesSort: compareFunc,
  },
};
