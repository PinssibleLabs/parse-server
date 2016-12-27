
import PromiseRouter from '../PromiseRouter';
import rest          from '../rest';
import _             from 'lodash';
import url           from 'url';

const ALLOWED_GET_QUERY_KEYS = ['keys', 'include'];
var result_slave={};
var result_android_banner={};
var result_banner_meta={};
var result_android_sound={};
export class ClassesRouter extends PromiseRouter {

  handleFind(req) {
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

    if(req.params.className=="android_slave"
        &&result_slave
        &&result_slave.expire_time
        &&result_slave.expire_time>Date.now()
        &&result_slave.response){

      console.log('find from cache ',req.params.className);

      return Promise.resolve({ response: result_slave.response });

    }else if(req.params.className=="android_banner"
        &&result_android_banner
        &&result_android_banner.expire_time
        &&result_android_banner.expire_time>Date.now()
        &&result_android_banner.response){

      console.log('find from cache',req.params.className);

      return Promise.resolve({ response: result_android_banner.response });
    }else if(req.params.className=="banner_meta"
        &&result_banner_meta
        &&result_banner_meta.expire_time
        &&result_banner_meta.expire_time>Date.now()
        &&result_banner_meta.response){
      console.log('find from cache',req.params.className);

      return Promise.resolve({ response: result_banner_meta.response });
    }else if(req.params.className=="android_sound"
        &&result_android_sound
        &&result_android_sound.expire_time
        &&result_android_sound.expire_time>Date.now()
        &&result_android_sound.response){
      console.log('find from cache',req.params.className);

      return Promise.resolve({ response: result_android_sound.response });

    }else {
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
            if(req.params.className=="android_slave"){
              result_slave.expire_time=Date.now()+30*60*1000;
              result_slave.response=response;
            }else if(req.params.className=="android_sound"){

              result_android_sound.expire_time=Date.now()+30*60*1000;
              result_android_sound.response=response;
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
    return rest.update(req.config, req.auth, req.params.className, req.params.objectId, req.body, req.info.clientSDK);
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
