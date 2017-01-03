// global_config.js

import PromiseRouter   from '../PromiseRouter';
import * as middleware from "../middlewares";
let result={};
export class GlobalConfigRouter extends PromiseRouter {


  getGlobalConfig(req) {

    let cacheConfigs=req.config.cacheConfigs;
    let applicationId=req.config.applicationId;
    let cacheKey=applicationId+"_GlobalConfig";

    console.log("get config from cache");

    let cacheResult=result[cacheKey];
    if(cacheResult&&cacheResult.config_expire&&cacheResult.config_expire>Date.now()&&cacheResult.params){
      return Promise.resolve({ response: { params: cacheResult.params } });
    }else{
      return req.config.database.find('_GlobalConfig', { objectId: "1" }, { limit: 1 }).then((results) => {
        if (results.length != 1) {
          // If there is no config in the database - return empty config.
          return { response: { params: {} } };
        }
        let globalConfig = results[0];
        //如果该配置中存在cacheConfigs并且存在_GlobalConfig那么需要缓存
        if(cacheConfigs&&cacheConfigs.indexOf("_GlobalConfig")>=0){
            result[cacheKey]={
              config_expire:Date.now()+10*60*1000,
              params:globalConfig.params
            }

        }
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
