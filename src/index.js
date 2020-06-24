const fs = require('fs');
const path = require('path');
const core = require('@actions/core');
const github = require('@actions/github');

// most @actions toolkit packages have async methods
async function run() {
  try {
    var repo = core.getInput('repo');
    var dist = core.getInput('dist');
    var [owner, repo] = repo.split('/');
    core.info(`GITHUB_OWNER = '${owner}'`);
    core.info(`GITHUB_REPO = '${repo}'`);
    core.info(`ISSUES_DIST = '${dist}'`);

    let ghToken = process.env['GITHUB_TOKEN']
    if (!ghToken) {
      throw new Error('GITHUB_TOKEN not defined')
    }
    let ghWorkspacePath = process.env['GITHUB_WORKSPACE']
    if (!ghWorkspacePath) {
      throw new Error('GITHUB_WORKSPACE not defined')
    }
    ghWorkspacePath = path.resolve(ghWorkspacePath)
    core.info(`GITHUB_WORKSPACE = '${ghWorkspacePath}'`)

    let issuesDir = path.join(ghWorkspacePath, dist); 
    if (!fs.existsSync(issuesDir)) {
      fs.mkdirSync(issuesDir)
    }

    const octokit = github.getOctokit(ghToken);
    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo,
    });

    issues.forEach(ele => {
      let header = `---\ntitle: "${ele.title}"\nauthor: ${ele.user.login}\ndate: ${ele.created_at}\n---\n`
      let file = path.join(issuesDir, ele.number+'.md'); 
      fs.writeFile(file, header+ele.body, (err) => {
          if(err){
            throw err
          }

          core.info(`issue#${ele.number} -> ${file}`)
      });
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}

run()
