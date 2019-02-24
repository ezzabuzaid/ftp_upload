const fs = require('fs');
const path = require('path');
const Client = require('ftp');
const program = require('commander');

const client = new Client();
// Credintials here
client.connect({
  user: '',
  password: '',
  host: '',
});

function upload(files, from, to) {
  files.forEach((file, i) => {
    if (file instanceof FolderParser) {
      const splittedName = file.path.split('/');
      splittedName.splice(0, 1);
      const name = splittedName.join('/')
      client.mkdir(path.join(serverDist, name), () => { });
      upload(file.files, file.path, name)
    } else {
      const fromPath = path.join(from, file);
      const toPath = path.join(serverDist, to, file);
      client.append(fromPath, toPath, function (error) {
        console.log(`Upload FROM:: ${fromPath},`, `\n Upload TO:: ${toPath}`);
      });
    }
  });
}

class FileSystemUtils {
  static getDirectories(srcPath) {
    return fs.readdirSync(srcPath)
      .map(file => {
        const folderPath = path.join(srcPath, file);
        if (fs.statSync(folderPath).isDirectory()) {
          return new FolderParser(folderPath);
        }
        return file;
      });
  }
}

class FolderParser {
  constructor(path) {
    const names = path.split('/');
    this.name = names[names.length - 1];
    this.files = FileSystemUtils.getDirectories(path);
    this.path = path;
  }
}

var serverDist;

// npm i --save-dev commander
// node ftp --from="localFolder" --to="serverFolder"
program
  .option('-f, --from <required>', 'The name of folder in local point that contain { this (ftp file) }')
  .option('-t, --to <required>', 'The name of folder in server')
  .action(({ from, to }) => {
    client.on('ready', function () {
      const folder = new FolderParser(from);
      serverDist = `public_html/${to}`;
      client.mkdir(serverDist, true, () => { });
      upload(folder.files, folder.path, '');
      client.end();
    });
  })
  .parse(process.argv);
