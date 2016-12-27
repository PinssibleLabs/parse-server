// global_config.js

import PromiseRouter   from '../PromiseRouter';
import * as middleware from "../middlewares";
let result={};
export class GlobalConfigRouter extends PromiseRouter {


  getGlobalConfig(req) {

    if(result&&result.config_expire&&result.config_expire>Date.now()&&result.params){
      console.log("get config from cache");
      return Promise.resolve({ response: { params: result.params } });
    }else{
      return req.config.database.find('_GlobalConfig', { objectId: "1" }, { limit: 1 }).then((results) => {
        if (results.length != 1) {
          // If there is no config in the database - return empty config.
          return { response: { params: {} } };
        }
        let globalConfig = results[0];
        //设置30分钟读取一次数据库
        result.config_expire=Date.now()+30*60*1000;
        result.params=globalConfig.params;
        console.log("get config from db");

        return { response: { params: globalConfig.params } };
      });
    }

  }

  updateGlobalConfig(req) {
    let params = req.body.params;
    // Transform in dot notation to make sure it works
    const update = Object.keys(params).reduce((acc, key) => {
      acc[`params.${key}`] = params[key];
      return acc;
    }, {});
    return req.config.database.update('_GlobalConfig', {objectId: "1"}, update, {upsert: true}).then(() => ({ response: { result: true } }));
  }

  mountRoutes() {
    this.route('GET', '/config', req => { return this.getGlobalConfig(req) });
    this.route('PUT', '/config', middleware.promiseEnforceMasterKeyAccess, req => { return this.updateGlobalConfig(req) });
  }
}

export default GlobalConfigRouter;
