
import PromiseRouter from '../PromiseRouter';
import rest          from '../rest';
import _             from 'lodash';
import url           from 'url';
import crypto         from  'crypto';
const ALLOWED_GET_QUERY_KEYS = ['keys', 'include'];
var result_slave={};
var result_android_banner={};
var result_banner_meta={};
var result_android_sound={};
var result={};

export class ClassesRouter extends PromiseRouter {

  handleFind(req) {

    let applicationId=req.config.applicationId;
    let cacheConfigs=req.config.cacheConfigs;
    let body = Object.assign(req.body, ClassesRouter.JSONFromQuery(req.query));
    let options = {};
    let allowConstraints = ['skip', 'limit', 'order', 'count', 'keys',
      'include', 'redirectClassNameForKey', 'where'];

    for (let key of Object.keys(body)) {
      if (allowConstraints.indexOf(key) === -1) {
        throw new Parse.Error(Parse.Error.INVALID_QUERY, `Invalid parameter for query: ${key}`);
      }
    }

    if (body.skip) {
      options.skip = Number(body.skip);
    }
    if (body.limit || body.limit === 0) {
      options.limit = Number(body.limit);
    } else {
      options.limit = Number(100);
    }
    if (body.order) {
      options.order = String(body.order);
    }
    if (body.count) {
      options.count = true;
    }
    if (typeof body.keys == 'string') {
      options.keys = body.keys;
    }
    if (body.include) {
      options.include = String(body.include);
    }
    if (body.redirectClassNameForKey) {
      options.redirectClassNameForKey = String(body.redirectClassNameForKey);
    }
    if (typeof body.where === 'string') {
      body.where = JSON.parse(body.where);
    }

    let cacheKey=applicationId+req.params.className+JSON.stringify(body.where)+JSON.stringify(options);
    let hasher=crypto.createHash("md5");
    hasher.update(cacheKey);
    let md5CacheKey=hasher.digest('hex').toString();
    if(req.params.className!="_GlobalConfig"
        &&result[md5CacheKey]
        &&cacheConfigs.length>0
        &&result[md5CacheKey].expire_time>Date.now()
        &&result[md5CacheKey].response){
      return Promise.resolve({ response: result[md5CacheKey].response });

    } else {
      console.log('find from db',req.params.className);
      return rest.find(req.config, req.auth, req.params.className, body.where, options, req.info.clientSDK)
          .then((response) => {
            if (response && response.results) {
              for (let result of response.results) {
                if (result.sessionToken) {
                  result.sessionToken = req.info.sessionToken || result.sessionToken;
                }
              }
            }
            if(cacheConfigs&&cacheConfigs.length>0&&cacheConfigs.indexOf(req.params.className)>=0){

              result[md5CacheKey]={
                expire_time:Date.now()+10*60*1000,
                response:response
              }
            }

            return { response: response };
          });
    }

  }

  // Returns a promise for a {response} object.
  handleGet(req) {
    let body = Object.assign(req.body, ClassesRouter.JSONFromQuery(req.query));
    let options = {};

    for (let key of Object.keys(body)) {
      if (ALLOWED_GET_QUERY_KEYS.indexOf(key) === -1) {
        throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Improper encode of parameter');
      }
    }

    if (typeof body.keys == 'string') {
      options.keys = body.keys;
    }
    if (body.include) {
      options.include = String(body.include);
    }

    return rest.get(req.config, req.auth, req.params.className, req.params.objectId, options, req.info.clientSDK)
        .then((response) => {
          if (!response.results || response.results.length == 0) {
            throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Object not found.');
          }

          if (req.params.className === "_User") {

            delete response.results[0].sessionToken;

            const user =  response.results[0];

            if (req.auth.user && user.objectId == req.auth.user.id) {
              // Force the session token
              response.results[0].sessionToken = req.info.sessionToken;
            }
          }


          return { response: response.results[0] };
        });
  }

  handleCreate(req) {
    return rest.create(req.config, req.auth, req.params.className, req.body, req.info.clientSDK);
  }

  handleUpdate(req) {
    let putForbiddenConfigs=req.config.putForbiddenConfigs;
    //判断是否对该请求进行forbidden操作
    if(putForbiddenConfigs&&putForbiddenConfigs.indexOf(req.params.className)>=0){
      return Promise.resolve({ response: { objectId: req.params.objectId,updatedAt:new Date() } });

    }else{
      return rest.update(req.config, req.auth, req.params.className, req.params.objectId, req.body, req.info.clientSDK);
    }

  }

  handleDelete(req) {
    return rest.del(req.config, req.auth, req.params.className, req.params.objectId, req.info.clientSDK)
        .then(() => {
          return {response: {}};
        });
  }

  static JSONFromQuery(query) {
    let json = {};
    for (let [key, value] of _.entries(query)) {
      try {
        json[key] = JSON.parse(value);
      } catch (e) {
        json[key] = value;
      }
    }
    return json
  }

  mountRoutes() {
    this.route('GET', '/classes/:className', (req) => { return this.handleFind(req); });
    this.route('GET', '/classes/:className/:objectId', (req) => { return this.handleGet(req); });
    this.route('POST', '/classes/:className', (req) => { return this.handleCreate(req); });
    this.route('PUT', '/classes/:className/:objectId', (req) => { return this.handleUpdate(req); });
    this.route('DELETE',  '/classes/:className/:objectId', (req) => { return this.handleDelete(req); });
  }
}

export default ClassesRouter;
