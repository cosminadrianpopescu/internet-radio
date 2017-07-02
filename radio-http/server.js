// NPM-Free Server by The Jared Wilcurt
// All you need to run this is an installed copy of Node.JS
// Put this next to the files you want to serve and run: node server.js

// Require in some of the native stuff that comes with Node
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const VTunner = require('./vtunner');
const MPlayer = require('./mplayer');
const mplayer = require('mplayer');
const File = require('./file');
const YTdl = require('./ytdl');
const System = require('./system');
const ws = require('nodejs-websocket');
const EvtManager = require('./evt-manager');
// Port number to use
var port = process.argv[2] || 8080;
// Colors for CLI output
var WHT = '\033[39m';
var RED = '\033[91m';
var GRN = '\033[32m';

let commandsMap = {
    radio_browser: VTunner,
    read_file: File, 
    save_file: File,
    browse_files: File,
    log: File,
    openUrl: MPlayer,
    get_metadata: MPlayer,
    get_status: MPlayer,
    pause: MPlayer,
    play: MPlayer,
    stop: MPlayer,
    seek_forward: MPlayer,
    is_cached: YTdl,
    cache: YTdl,
    get_youtube_url: YTdl,
    shutdown: System,
    reboot: System,
}

// Create the server
http.createServer(function (request, response) {

    // The requested URL like http://localhost:8000/file.html
    var uri = url.parse(request.url).pathname;
    let query = url.parse(request.url).query;
    // get the file.html from above and then find it from the current folder
    var filename = path.join(process.cwd(), uri);

    // Setting up MIME-Type (YOU MAY NEED TO ADD MORE HERE) <--------
    var contentTypesByExtension = {
        '.html': 'text/html',
        '.css':  'text/css',
        '.js':   'text/javascript',
        '.json': 'text/json',
        '.svg':  'image/svg+xml'
    };

    // Check if the requested file exists
    fs.exists(filename, function (exists) {
        // If it doesn't
        if (fs.statSync(filename).isDirectory()) {
            // Output a green line to the console explaining what folder was requested
            console.log(GRN + 'FLDR: ' + WHT + filename);
            // redirect the user to the index.html in the requested folder
            filename += '/index.html';
        }

        // Assuming the file exists, read it
        fs.readFile(filename, 'binary', function (err, file) {
            // Output a green line to console explaining the file that will be loaded in the browser
            console.log(GRN + 'FILE: ' + WHT + filename);
            // If there was an error trying to read the file
            if (err) {
                // Put the error in the browser
                response.writeHead(500, {'Content-Type': 'text/plain'});
                response.write(err + '\n');
                response.end();
                return;
            }

            // Otherwise, declar a headers object and a var for the MIME-Type
            var headers = {};
            var contentType = contentTypesByExtension[path.extname(filename)];
            // If the requested file has a matching MIME-Type
            if (contentType) {
                // Set it in the headers
                headers['Content-Type'] = contentType;
            }

            // Output the read file to the browser for it to load
            response.writeHead(200, headers);
            response.write(file, 'binary');
            response.end();
        });

    });

}).listen(parseInt(port, 10));

ws.createServer((conn) => {
    global.MPLAYER = new mplayer({args: ['-novideo']});
    global.EVT_MANAGER = new EvtManager(conn);
    conn.on("text", str => {
        let obj = JSON.parse(str);
        if (obj.command != 'save_file'){
            console.log('received str', str);
        }
        if (commandsMap[obj.command]){
            let handler = new commandsMap[obj.command](conn, obj);
            handler.handle();
        }
    })
}).listen(1234);

// Message to display when server is started
console.log(WHT + 'Static file server running at\n  => http://localhost:' + port + '/\nCTRL + C to shutdown');
