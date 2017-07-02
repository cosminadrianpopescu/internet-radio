let BaseHandler = require('./base-handler');
let fs = require('fs');

class File extends BaseHandler {
    constructor(conn, args){
        super(conn, args);
    }

    handle_error(msg){
        console.log(msg);
    }

    save_file(){
        fs.writeFileSync(this._args.path + this._args.name, this._args.content);
    }

    read_file(){
        fs.readFile(this._args.file, 'utf8', (err, data) => {
            if (err){
                this.handle_error('Error reading from', this._args.file);
                this.respond("{}");
                return ;
            }

            this.respond(data);
        })
    }

    static toFileItem(file, args){
        let absPath = args.path + (args.path.match(/\/$/g) ? '' : '/') + file;
        return {
            path: absPath,
            type: file == '..' || fs.lstatSync(absPath).isDirectory() ? 'dir' : 'file',
            name: file,
        }
    }

    browse_files() {
        fs.readdir(this._args.path, (err, files) => {
            if (err){
                this.handle_error('Error browsing', this._args.file);
            }

            this.respond([File.toFileItem('..', this._args), ...files.map(file => File.toFileItem(file, this._args))]);
        });
    }

    log() {
        fs.appendFile("/tmp/radio-interface.log", this._args.msg + "\n", (err) => {});
    }
}

module.exports = File;
