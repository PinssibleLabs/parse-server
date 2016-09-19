/**
 * Created by gongchen on 16/9/19.
 */
/**
 * Created by gongchen on 16/9/19.
 */
'use strict';
let request = require('./request');
class VerifyUtil {


    getVerifyEmail(email,public_key){
        let options={
            hostname: "api.mailgun.net",
            port: 443,
            path: "/v3/address/validate?address="+email,
            method: "GET"
        };

        return request.getHttpsBasicAuth('api_key','pubkey-6d16ad006905b67202d6d8e860b7eef8',options).then((data)=>{
            if(data){
                let result=JSON.parse(data);
                if(result.is_valid){
                    return Promise.resolve(true);
                }else{
                    return Promise.resolve(false);
                }
            }else{
                return Promise.reject();
            }
        });


    }

}

module.exports = new VerifyUtil();
