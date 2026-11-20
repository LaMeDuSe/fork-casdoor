// semantic-release configuration for the LaMeDuSe fork.
//
// GitHub rejects a release body over 125,000 characters. A release that follows an
// upstream merge spans hundreds of commits, so the notes keep at most
// MAX_COMMITS_PER_GROUP commits per section and link to the full compare view.
const MAX_COMMITS_PER_GROUP = 40;

module.exports = {
  debug: true,
  branches: [
    "+([0-9])?(.{+([0-9]),x}).x",
    "master",
    {name: "rc"},
    {name: "beta", prerelease: true},
    {name: "alpha", prerelease: true},
  ],
  plugins: [
    "@semantic-release/commit-analyzer",
    ["@semantic-release/release-notes-generator", {
      writerOpts: {
        finalizeContext(context) {
          for (const group of context.commitGroups || []) {
            const total = group.commits.length;
            if (total > MAX_COMMITS_PER_GROUP) {
              group.commits = group.commits.slice(0, MAX_COMMITS_PER_GROUP);
              group.title = `${group.title} (${MAX_COMMITS_PER_GROUP} of ${total}, full list in the comparison above)`;
            }
          }
          for (const group of context.noteGroups || []) {
            for (const note of group.notes) {
              if (note.text && note.text.length > 2000) {
                note.text = note.text.slice(0, 2000) + "…";
              }
            }
          }
          return context;
        },
      },
    }],
    ["@semantic-release/github", {
      failOnError: false,
    }],
  ],
};
