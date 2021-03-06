var child = require('child_process'),
    fs = require('fs'),
    fileName = 'ndef.bin'; // TODO use temp files

function defaultCallback(err) {
    if (err) { throw err; }
}

function defaultReadCallback(err, data) {
    if (err) { throw err; }
    console.log(data);
}

function defaultWaitCallback(err, data) {
    if (err) { throw err; }
    console.log(data);
}

// callback(err, data)
// data is stream of ndef bytes from the tag
function read(callback) {
    
    var errorMessage = "",
        readMifareClassic = child.spawn('mifare-classic-read-ndef', [ '-y', '-o', fileName]);

    if (!callback) { callback = defaultReadCallback; }

    readMifareClassic.stdout.on('data', function (data) {
        process.stdout.write(data + "");        
    });

    readMifareClassic.stderr.on('data', function (data) {
        errorMessage += data;
        // console.log('stderr: ' + data);
    });

    readMifareClassic.on('close', function (code) {
        if (code === 0 && errorMessage.length === 0) {
            fs.readFile(fileName, function (err, data) {
                callback(err, data);
                fs.unlinkSync(fileName);          
            });
        } else {
            callback(errorMessage);
        }
    });
}

// callback(err)
function write(data, callback) {
    
    var buffer = Buffer(data),
        errorMessage = "";

    if (!callback) { callback = defaultCallback; }
        
    fs.writeFile(fileName, buffer, function(err) {
        if (err) callback(err);
        writeMifareClassic = child.spawn('mifare-classic-write-ndef', [ '-y', '-i', fileName]);
        
        writeMifareClassic.stdout.on('data', function (data) {
            process.stdout.write(data + "");
        });
        
        writeMifareClassic.stderr.on('data', function (data) {
            errorMessage += data;
            // console.log('stderr: ' + data);
        });

        writeMifareClassic.on('close', function (code) {
            if (code === 0 && errorMessage.length === 0) {
                callback(null);
                fs.unlinkSync(fileName);
            } else {
                callback(errorMessage);
            }
        });
    });
}

function format(callback) {
    
    var errorMessage;

    if (!callback) { callback = defaultCallback; }
    
    formatMifareClassic = child.spawn('mifare-classic-format', [ '-y']);
        
    formatMifareClassic.stdout.on('data', function (data) {
        process.stdout.write(data + "");
    });
    // 
    formatMifareClassic.stderr.on('data', function (data) {
        errorMessage += data;
        // console.log('stderr: ' + data);
    });

    formatMifareClassic.on('close', function (code) {
        if (code === 0) {
            callback(null);
        } else {
            callback(errorMessage);
        }
    });
}

function waitForNFCTag(callback) {
    
    var cmd=child.spawnSync('../bin/nfc-mifare-wait');
    if (!callback) { callback = defaultWaitCallback; }
    
    callback(cmd.stderr.toString(), cmd.stdout.toString());
    
    return cmd.status;
    
}

function waitForNFCAuth(callback) {
    console.log("Wait for Tag with matching UID: \n");
    var cmd=child.spawnSync('../bin/nfc-mifare-secretkey');
    if (!callback) { callback = defaultWaitCallback; }
    
    return callback(cmd.stderr.toString(), cmd.stdout.toString());
    
}

module.exports = {
    read: read,
    write: write,
    format: format,
    waitForNFCTag: waitForNFCTag,
    waitForNFCAuth: waitForNFCAuth
};