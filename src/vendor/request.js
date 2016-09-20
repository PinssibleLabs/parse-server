/**
 * Created by gongchen on 16/9/19.
 */
'use strict';

const http = require('http');
const  https=require('https');
class Request {
    getHttpsBasicAuth(user,pwd,options){
        let auth = 'Basic ' +  new Buffer(user + ':' + pwd).toString('base64');
        options = {
            hostname: options.hostname,
            port: options.port,
            path: options.path,
            method: options.method,
            headers: {
                'Authorization': auth
            }
        };
        return new Promise((resolve, reject) => {
            var data = '';
            var req = https.get(options, (res) => {
                console.log(`Got response: ${res.statusCode}`);

                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    data += chunk;
                    console.log(chunk);
                });
                res.on('end', () => {
                    console.log('No more data in response.');
                    resolve(data);
                })

            }).on('socket', (socket) => {
                socket.setTimeout(2*60 * 1000);
                socket.on('timeout', function() {
                    req.abort();
                });
            }).on('error', (e) => {
                console.log(`Got error: ${e.message}`);
                reject(e);
            });
        });
    }
    postDataHttp(postData,options){
        return new Promise((resolve, reject) => {
            var data = '';
            var req = http.request(options, (res) => {

                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    console.log(`BODY: ${chunk}`);
                    data += chunk;
                });
                res.on('end', () => {
                    resolve(data);
                })
            });
            req.write(postData);
            req.end();
            req.on('error', (e) => {
                console.log(`problem with request: ${e.message}`);
                reject(e);
            });

        });




    }
}

module.exports = new Request();
