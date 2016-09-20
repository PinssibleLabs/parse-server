/**
 * Created by gongchen on 16/9/20.
 */
/**
 * Created by gongchen on 16/9/19.
 */
/**
 * Created by gongchen on 16/9/19.
 */
'use strict';
let request = require('./Request');
let querystring=require('querystring');

class sendEmailUtil {

    sendEmailBySendCloud(configs){
        let postData=querystring.stringify({
            apiUser:configs.api_user,
            apiKey:configs.api_key,
            from:configs.from,
            fromname:configs.fromname,
            subject:configs.subject,
            to:configs.to,
            html:configs.html

        });
        let options = {
            hostname: 'api.sendcloud.net',
            port: 80,
            path: '/apiv2/mail/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                "Content-Length": postData.length
            }
        };
        return request.postDataHttp(postData,options).then((data)=>{
            if(data){
                let result=JSON.parse(data);
                if(result.result){
                    console.log('sendCloud',configs.to+result.message);
                }else{
                    console.log('sendCloud',configs.to+result.message);
                }
            }else{
                return Promise.reject('');
            }
        });


    }


}

module.exports = new sendEmailUtil();
