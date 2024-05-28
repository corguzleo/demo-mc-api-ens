const express = require('express')
const path = require('path')
var bodyParser = require('body-parser')

const PORT = process.env.PORT || 5001

const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://mc_evs:mc_evs@localhost:5432/demo_mc_evs_test',
  ssl: {
    rejectUnauthorized: false
  }
});

// create application/json parser
var jsonParser = bodyParser.json()
var request = require('request');
const axios = require('axios');

let urlBaseMCAuth = "https://"+ process.env.MC_SUBDOMAIN +".auth.marketingcloudapis.com";
let urlBaseMCRest = "https://"+ process.env.MC_SUBDOMAIN +".rest.marketingcloudapis.com";


global.mc_credenciales = {
  "grant_type": 'client_credentials',
  "client_id": process.env.MC_CLIENT_ID,
  "client_secret": process.env.MC_CLIENT_SECRET,
  "account_id": process.env.MC_ACCOUNT_ID,
  "urlBaseMCAuth": urlBaseMCAuth,
  "urlBaseMCRest":urlBaseMCRest,
             "urlAuth": urlBaseMCAuth + "/v2/token",
        "urlCallbacks": urlBaseMCRest + "/platform/v1/ens-callbacks",
  "urlCallbacksVerify": urlBaseMCRest + "/platform/v1/ens-verify",
    "urlSubscriptions": urlBaseMCRest + "/platform/v1/ens-subscriptions",
  "oAuthAccessToken": "",
  "oAuthAccessTokenExpiry":""
};




express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/app/db/init',jsonParser, async (req,res) => {
    try {
      const client = await pool.connect();
      console.log('/app/db/init');
      //const result = await client.query('SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = \'callbacks\')');
      const result = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_name IN ('callbacks','subscriptions','events','dispachers_eventos','events_general','conversaciones','webhooks','webhookevents')`);
      const results = { 'results': (result) ? result.rows : null};
      //console.log('result',results);
      let respRequest='';
      if(result.rows.length==8){
        client.query('\
        CREATE TABLE IF NOT EXISTS callbacks (id SERIAL,callbackid text,verificationkey text,callbackname text NOT NULL,url text,urlforward text,signaturekey text,maxbatchsize bigint,status text,statusreason text,created_at TIMESTAMP DEFAULT NOW()); \
        CREATE TABLE IF NOT EXISTS subscriptions (id SERIAL,subscriptionid text PRIMARY KEY,subscriptionname text,callbackid text NOT NULL,callbackname text,eventcategorytypes text,filters text,status text,idcallback bigint,created_at TIMESTAMP DEFAULT NOW()); \
        CREATE TABLE IF NOT EXISTS events (id SERIAL PRIMARY KEY,"eventCategoryType" text,eid text,mid text,"senderType" text,"messageType" text,"channelId" text,"messageId" text,"timestampUTC" bigint,"mobileNumber" text,"contactId" text,"messageBody" text,"messageKey" text,status text,reason text,body text,callbackid text,idcallback bigint,created_at TIMESTAMP DEFAULT NOW()); \
        CREATE TABLE IF NOT EXISTS dispachers_eventos (id SERIAL PRIMARY KEY,"eventCategoryType" text,eid text,mid text,"senderType" text,"messageType" text,"channelId" text,"messageId" text,"timestampUTC" bigint,"mobileNumber" text,"contactId" text,"messageBody" text,"messageKey" text,status text,reason text,body text,callbackid text,idcallback bigint,created_at TIMESTAMP DEFAULT NOW()); \
        CREATE TABLE IF NOT EXISTS events_general (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,body text,created_at TIMESTAMP DEFAULT NOW());\
        CREATE TABLE IF NOT EXISTS conversaciones (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,"definitionKey" text,"senderID" text,"contentCustomerKey" text,"contactKey" text,"messageKey" text,"to" text,message text,"tipoMensaje" text,"telefonoCliente" text,"timestampUTC" text,created_at timestamp without time zone NOT NULL DEFAULT now(),"contactId" text,eid text,mid text); \
        CREATE INDEX IF NOT EXISTS callbacks_id_index ON callbacks(id int4_ops); \
        CREATE UNIQUE INDEX IF NOT EXISTS demo_callbacks_pkey ON callbacks(callbackid text_ops); \
        CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_pkey ON subscriptions(subscriptionid text_ops); \
        CREATE UNIQUE INDEX IF NOT EXISTS demo_subscriptions_pkey ON subscriptions(subscriptionid text_ops); \
        CREATE INDEX IF NOT EXISTS subscriptions_callbackid_index ON subscriptions(callbackid text_ops); \
        CREATE INDEX IF NOT EXISTS subscriptions_status_index ON subscriptions(status text_ops); \
        CREATE UNIQUE INDEX IF NOT EXISTS events_pkey ON events(id int4_ops); \
        CREATE INDEX IF NOT EXISTS events_callbackid_index ON events(callbackid text_ops); \
        CREATE INDEX IF NOT EXISTS events_idcallback_index ON events(idcallback int8_ops); \
        CREATE UNIQUE INDEX IF NOT EXISTS dispachers_pkey ON dispachers_eventos(id int4_ops); \
        CREATE UNIQUE INDEX IF NOT EXISTS demo_dispachers_pkey ON dispachers_eventos(id int4_ops); \
        CREATE INDEX IF NOT EXISTS dispachers_callbackid_index ON dispachers_eventos(callbackid text_ops); \
        CREATE INDEX IF NOT EXISTS dispachers_idcallback_index ON dispachers_eventos(idcallback int8_ops); \
        CREATE UNIQUE INDEX IF NOT EXISTS events_general_pkey ON events_general(id int4_ops); \
        CREATE UNIQUE INDEX IF NOT EXISTS conversaciones_pkey ON conversaciones(id int4_ops); \
        CREATE TABLE IF NOT EXISTS webhooks (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,name text,created_at timestamp without time zone DEFAULT now(),uuid text); \
        CREATE TABLE IF NOT EXISTS webhookevents (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,webhookid integer REFERENCES webhooks(id) ON DELETE CASCADE,created_at timestamp without time zone DEFAULT now(),uuid text,body text); \
        CREATE UNIQUE INDEX IF NOT EXISTS webhooks_pkey ON webhooks(id int4_ops); \
        CREATE INDEX IF NOT EXISTS webhooks_uuid ON webhooks(uuid text_ops); \
        CREATE UNIQUE INDEX IF NOT EXISTS webhookevent_pkey ON webhookevents(id int4_ops); \
        CREATE INDEX IF NOT EXISTS webhookevent_uuid ON webhookevents(uuid text_ops); \
        SELECT table_name FROM information_schema.tables WHERE table_name IN (\'callbacks\',\'subscriptions\',\'events\',\'dispachers_eventos\',\'events_general\',\'conversaciones\',\'webhooks\',\'webhookevents\');\
        ',(err, result) => {   
            console.log("Termina query");
            results.results = result[result.length-1].rows;
            if(err){
                respRequest = err;
                console.log("Error en query ", err);
            }else{
              respRequest = 'Se creo la BD';
            }
            client.end();
        });
      }
      res.render('pages/dbInit',results);
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .get('/callbacks',async (req,res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM callbacks ORDER BY id DESC');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/callbacks',results);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .get('/callbacks/:idcb',async (req,res) => {
    try {
      console.log(req.params.callbacksid);
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM subscriptions WHERE idcallback=$1 ORDER BY id DESC',[req.params.idcb]);
      const resultEvents = await client.query('SELECT * FROM events WHERE idcallback=$1 ORDER BY id DESC',[req.params.idcb]);
      const results = { 'results': (result) ? result.rows : null, 'resultsEvents': (resultEvents) ? resultEvents.rows : null};
      //console.log('results',results);
      res.render('pages/subscriptions',results);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .get('/conversaciones',async (req,res) => {
    try {
      console.log('Get conversaciones');
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM conversaciones ORDER BY id DESC');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/conversaciones',results);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .get('/events',async (req,res) => {
    try {
      console.log('Get Events');
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM events_general ORDER BY id DESC');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/events',results);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .post('/events',jsonParser, async (req,res) => {
    saveEvent(req.body);
  })
  .post('/callbacks/:idcb',jsonParser, async (req,res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM callbacks WHERE id=$1 ORDER BY id DESC',[req.params.idcb]);
      const results = (result) ? result.rows : null;
      //console.log(results);
      if(result!=null){
        let callbackItem = results[0];
        console.log('callbackItem',req.body.callbackId, callbackItem.callbackid,req.body.callbackId == callbackItem.callbackid);

        if(req.body.verificationKey){//if(req.body.callbackId == callbackItem.callbackid){ // Bloque de verificacion del callback
          console.log('verificationKey',req.body.verificationKey);
          const resultupdate = await client.query('UPDATE callbacks SET verificationkey=$1, callbackid=$2 WHERE id=$3',[req.body.verificationKey,req.body.callbackId,callbackItem.id]);
          //console.log(resultupdate);
          res.sendStatus(200);
        }else if(Array.isArray(req.body)){// Bloque de guardado de eventos
          var eventItemId = 0;
          for(const item of req.body){
            console.log(item.eventCategoryType);
            item.callbackId = req.body.callbackId;
            item.id = callbackItem.id;
            client.query('INSERT INTO events ("eventCategoryType", body, callbackid, idcallback) VALUES ($1, $2, $3, $4) RETURNING id', [item.eventCategoryType, item, item.callbackId, item.id], (error, results) => {
              console.log("item.senderType=='WhatsApp'",item.senderType=='WhatsApp');
              itemmessageBodytextbody = '';
              if(item.senderType=='WhatsApp'){
                if(item.messageBody){
                  if(item.messageBody.text){
                    itemmessageBodytextbody = item.messageBody.text.body;
                  }else if(item.messageBody.button){
                    itemmessageBodytextbody = item.messageBody.button.text;
                  }
                }
                saveConversacion(
                  item.definitionKey || '', item.senderID || '', item.contentCustomerKey || '', item.contactKey || '', item.messageKey || '', item.channelId || '', itemmessageBodytextbody || '', 
                  'inbound', item.mobileNumber || '', item.timestampUTC || '', 
                  req.body.contactId || '', req.body.eid || '', req.body.mid || ''
                );
              }
              //console.log(results,error);
              if (error) {
                throw error
              }
              eventItemId = results.rows[0].id;
            });
            //Envio a dispacher
            if(callbackItem.urlforward){
              console.log('callbackItem forwarded');
              request.post({
                headers: {'content-type' : 'application/json'},
                url:     callbackItem.urlforward,
                body:    JSON.stringify(item)
              }, function(error, response, body){
                console.log('request.post',body);
                if(error){
                  console.log('request.error',error);
                }
              });
            }
          }
          res.status(201).send(`Event added with ID: ${eventItemId}`);
        }else{ // Bloque de manejo de solicitudes inesparadas
          console.log(req.body);
          console.log('Sin manejar el tipo de contenido');
          res.sendStatus(200);
        }
      }else{
        console.error(err);
        res.send("Error " + err);
      }
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
      client.release();
    }
  })
  .get('/api/callback/new/:cbName',jsonParser, async (req,res) => {
    try {
      const client = await pool.connect();
      //var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
      const result = await pool.query('INSERT INTO callbacks (callbackname) VALUES ($1)', [req.params.cbName]);
      const item = result.rows[0];
      console.log(item);
      res.redirect('/callbacks');
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .get('/api/callback/send/:idcb',jsonParser, async (req,res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT id,callbackname,callbackid,url FROM callbacks WHERE id=$1',[req.params.idcb]);
      const results = { 'results': (result) ? result.rows : null};
      const item = results.results[0];
      
      let callbackInfo = [
        {
            "callbackName": item.callbackname,
            "url": 'https://' + req.get('host') + '/callbacks/' + item.id,
            "maxBatchSize": 1000
        }
      ];
      console.log('callbackInfo',callbackInfo);
      if(item.callbackid!=null && item.callbackid!=''){
        console.log("Ya se envio a MC");
        res.json(callbackInfo);
      }else{
        let respRequest = await doPost(mc_credenciales.urlCallbacks,callbackInfo);
        let respItem = respRequest.data[0];
        pool.query('UPDATE callbacks SET callbackid = $1, signaturekey = $2, url = $3  WHERE id=$4', [respItem.callbackId, respItem.signatureKey, respItem.url, req.params.idcb]);
        res.json(callbackInfo);
      }
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .get('/api/callback/verify/:idcb',jsonParser, async (req,res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT id,verificationkey,callbackid FROM callbacks WHERE id=$1',[req.params.idcb]);
      const results = { 'results': (result) ? result.rows : null};
      const item = results.results[0];
      
      let callbackInfo = {
            "callbackId": item.callbackid,
            "verificationKey": item.verificationkey
        };
      console.log('callbackInfo',callbackInfo);
      let respRequest = await doPost(mc_credenciales.urlCallbacksVerify,callbackInfo);
      let respItem = respRequest.data[0];
      pool.query('UPDATE callbacks SET status = $1 WHERE id=$2', ['verify',req.params.idcb]);
      res.json(callbackInfo);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .get('/api/callback/subscription/new/:idcb',jsonParser, async (req,res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT id,callbackid,callbackname FROM callbacks WHERE id=$1 ORDER BY id DESC',[req.params.idcb]);
      const results = { 'results': (result) ? result.rows : null};
      const item = results.results[0];
      let ranval = Math.floor(Math.random()*(999-100+1)+100);
      let subscriptionInfo = [
        {
            "callbackId": item.callbackid,
            "subscriptionName": item.callbackname + "-subscription-"+ranval,
            "eventCategoryTypes": [
                "EngagementEvents.OttMobileOriginated",
                "TransactionalSendEvents.OttNotSent",
                "TransactionalSendEvents.EmailNotSent",
                "TransactionalSendEvents.EmailSent",
                "TransactionalSendEvents.EmailBounced",
                "EngagementEvents.EmailClick",
                "EngagementEvents.EmailOpen",
                "TransactionalSendEvents.SmsBounced",
                "TransactionalSendEvents.SmsDelivered",
                "TransactionalSendEvents.SmsTransient",
                "TransactionalSendEvents.SmsSent",
                "TransactionalSendEvents.SmsNotSent",
                "EngagementEvents.EmailUnsubscribe",
                "SendEvents.AutomationInstanceCompleted",
                "SendEvents.AutomationInstanceErrored",
                "SendEvents.AutomationInstanceSkipped",
                "SendEvents.AutomationInstanceStarted",
                "SendEvents.AutomationInstanceStopped"
            ]
        }
    ];
      console.log('subscriptionInfo',subscriptionInfo);
      let respRequest = await doPost(mc_credenciales.urlSubscriptions,subscriptionInfo);
      let respItem = respRequest.data[0];
      pool.query('INSERT INTO subscriptions ("subscriptionid", "subscriptionname", "callbackid", "callbackname", "eventcategorytypes", "status", "idcallback") VALUES($1, $2, $3, $4, $5, $6, $7)',
      [respItem.subscriptionId, respItem.subscriptionName, respItem.callbackId, respItem.callbackName, JSON.stringify(respItem.eventCategoryTypes), respItem.status, req.params.idcb]);
      client.query('UPDATE callbacks SET status=$1 WHERE id=$2',['active',item.id]);
      res.json(respItem);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .get('/messaging', (req, res) => res.render('pages/messaging'))
  .post('/messaging/v1/ott/definitions',jsonParser, async (req,res) => {
    let newDefinition = {
      "definitionKey": "demo_leo001",
      "name": "demoleo001",
      "status": "Active",
      "senderType": "WhatsApp",
      "senderId": "5491165520806",
      "description": "Using new WhatsApp Transactional API",
      "content": {
        "customerKey": "c52f62eb-3400-4296-88b9-92fe8e41fa24"
      }
    };

  })
  .get('/asset/v1/content/assets/:contentCustomerKey',jsonParser, async (req,res) => {
    let respRequest = await getContentCustomerKey(req.params.contentCustomerKey);
    res.json(respRequest);
  })
  .get('/messaging/v1/ott/definitions/:definitionKey',jsonParser, async (req,res) => {
    let respRequest = await getDeffinitionByKey(req.params.definitionKey);
    res.json(respRequest);
  })
  .post('/messaging/v1/ott/messages',jsonParser, async (req,res) => {
    console.log('/messaging/v1/ott/messages');
    let respRequest = {statusTxt:'', data:{}};
    respRequest.status = 'success';
    let definitionResp = await getDeffinitionByKey(req.body.definitionKey);
    if(definitionResp.data.content.customerKey){
      let contentResp = await getContentCustomerKey(definitionResp.data.content.customerKey);
      let msgTemplateMessage = '';
      let msgTemplateParams = {};
      let msgParamsName = {};
      if(contentResp.data.items[0].views.whatsapptemplate){
        msgTemplateMessage = contentResp.data.items[0].views.whatsapptemplate.meta.options.customBlockData['display:message'];
        msgTemplateParams = contentResp.data.items[0].views.whatsapptemplate.meta.options.customBlockData['display:message:parameters'];

      for (const [key, data] of Object.entries(msgTemplateParams)) {
          msgParamsName[data['display:argument'].replaceAll('%','')] = data['display:argument:name'];
      };
      }else if(contentResp.data.items[0].views.whatsappsession){
        msgTemplateMessage = contentResp.data.items[0].views.whatsappsession.meta.options.customBlockData['display:message'];
        //El template no trae las variables msgTemplateParams
        msgParamsName.directAttributes = true;
      }

      
      var msgsWithData = [];
      req.body.recipients.forEach(function (recipient, key) {
        var msgWithData = {'recipient':recipient,'message':msgTemplateMessage, 'definitionKey':req.body.definitionKey}; 
          for (const [key, data] of Object.entries(recipient.attributes)) {
            if(msgParamsName.directAttributes){
              msgWithData.message = msgWithData.message.replaceAll('%%'+ key + '%%',data);
            }else{
              msgWithData.message = msgWithData.message.replaceAll('${'+ msgParamsName[key] + '}',data);
            }
          }
          msgsWithData.push(msgWithData);
      });
      console.log('msgsWithData',msgsWithData);
      msgsWithData.forEach(function (msg, key) {
        saveEvent(msg);
        saveConversacion(req.body.definitionKey, definitionResp.data.senderID, definitionResp.data.content.customerKey, 
          msg.recipient.contactKey, msg.recipient.messageKey, msg.recipient.to, msg.message, 
          'outbound', msg.recipient.to, Date.now(),
          '', '', '');
      });
      respRequest = await doPost(mc_credenciales.urlBaseMCRest + '/messaging/v1/ott/messages',req.body);
    }else{
      respRequest.status = 'error';
      respRequest.statusTxt = 'No se encontro el definitionKey';
    }
    
    console.log('respRequest:',respRequest);
    if(respRequest.status!='error'){
      res.json(respRequest);
    }else{
      res.json(respRequest);
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

  async function getDeffinitionByKey(definitionKey){
    console.log('definitionKey',definitionKey);
    let urlRequest = mc_credenciales.urlBaseMCRest + '/messaging/v1/ott/definitions/' + definitionKey;
    let respRequest = await doGet(urlRequest);
    return respRequest;
  }

  async function getContentCustomerKey(contentCustomerKey){
    console.log('ontentCustomerKey',contentCustomerKey);
    let urlRequest = mc_credenciales.urlBaseMCRest + '/asset/v1/content/assets?$filter=customerKey=' + contentCustomerKey;
    let respRequest = await doGet(urlRequest);
    return respRequest;
  }
  
  async function saveEvent(body){
    let respuesta = 'events_general added';
    try {
      const client = await pool.connect();
      //console.log('body',body);
      client.query('INSERT INTO events_general (body) VALUES ($1) RETURNING id', [body], (error, results) => {
        //console.log(results,error);
        if (error) {
          throw error
        }
      });
      client.release();
    } catch (err) {
      console.error(err);
      client.release();
      respuesta = 'error';
    }
    return respuesta;
  }

  async function saveConversacion(definitionKey, senderID, contentCustomerKey, contactKey, messageKey, to, message, tipoMensaje, telefonoCliente, timestampUTC, contactId, eid, mid){
    console.log('saveConversacion');
    let respuesta = 'conversacion added';
    try {
      const client = await pool.connect();
      client.query(
        'INSERT INTO conversaciones ("definitionKey", "senderID", "contentCustomerKey", "contactKey", "messageKey", "to", "message", "tipoMensaje", "telefonoCliente", "timestampUTC", "contactId", "eid", "mid") VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING "id"', 
        [definitionKey, senderID, contentCustomerKey, contactKey, messageKey, to, message, tipoMensaje, telefonoCliente, timestampUTC, contactId, eid, mid], (error, results) => {
        //console.log(results,error);
        if (error) {
          throw error
        }
      });
      client.release();
    } catch (err) {
      console.error(err);
      client.release();
      respuesta = 'error';
    }
    return respuesta;
  }

  async function doGet(url, postBody){
      let restResponse = {};
      let oauthAccessToken = await getOauthAccessToken();
      if(oauthAccessToken){
          // Got an OAuth Access Token, make GET call
          restResponse = await makeRestCall('GET', url, postBody, oauthAccessToken);
      }else{
          // Didn't get an OAuth Access Token
          // Fall through to return a 'RestResponse' in error state
      }
      return restResponse;
  }

  async function doPost(url, postBody){
        let restResponse = {};
        let oauthAccessToken = await getOauthAccessToken();
        if(oauthAccessToken){
            // Got an OAuth Access Token, make POST call
            restResponse = await makeRestCall('POST', url, postBody, oauthAccessToken);
        }else{
            // Didn't get an OAuth Access Token
            // Fall through to return a 'RestResponse' in error state
        }
        return restResponse;
  }

  async function getOauthAccessToken(){
      if(mc_credenciales.oAuthAccessToken && (new Date() < mc_credenciales.oAuthAccessTokenExpiry)){
          console.log("Using unexpired OAuth Access Token: " + mc_credenciales.oAuthAccessToken);
          return(mc_credenciales.oAuthAccessToken);
      }else{
          console.log("Getting a New OAuth Access Token");
          return await getNewOauthAccessToken();
      }
  }

  async function getNewOauthAccessToken(){
    console.log("getNewOAuthAccessToken called.");
    let postBody = {
      'grant_type':mc_credenciales.grant_type,
      'client_id': mc_credenciales.client_id,
      'client_secret': mc_credenciales.client_secret,
      'account_id': mc_credenciales.account_id
    };

    let response = await makeRestCall('POST', mc_credenciales.urlAuth, postBody);
    if(response.statusTxt == 'success'){
        console.log('-----------------getNewOAuthAccessToken success-----------------------');
        // success
        let tokenExpiry = new Date();
        tokenExpiry.setSeconds(tokenExpiry.getSeconds() + response.data.expires_in);
        
        mc_credenciales.oAuthAccessToken = response.data.access_token;
        mc_credenciales.oAuthAccessTokenExpiry = tokenExpiry;
        return mc_credenciales.oAuthAccessToken;
    }else{
        // error
        console.log("Error getting OAuth Access Token - check console logs.");
        return "";
    }
  }

  async function makeRestCall(verb, restUrl, postBody, oauthAccessToken){
  console.log("Making REST call: " + verb + " " + restUrl);

  if(oauthAccessToken){
    console.log("Using OAuth Access Token: " + oauthAccessToken);
  }

  // Put OAuth Access Token in the header if provided
  var restHeaders = {};
  restHeaders['Content-Type'] = 'application/json;charset=UTF-8';
  if(oauthAccessToken){
      restHeaders['Authorization'] = 'Bearer ' + oauthAccessToken;
  };

  // Make REST call and wait for it to complete
  let response = {};
  try{
      let axiosResponse = await axios({
          method: verb,
          url: restUrl,
          headers: restHeaders,
          data: postBody
      })

      response.statusTxt = 'success';
      response.status = axiosResponse.status;
      response.data = axiosResponse.data;

      console.log("StatusTxt: " + response.statusTxt);
      console.log("Status: " + response.status);
      //console.log("Response Data: " ,response.data);
  }catch(e){
      console.log("e: " , e);
      response.statusTxt = 'error';
      response.status = 'error';
      //response.status = e.response.status;
      //response.data = e.response.data;
  }

  return response;
  
}
