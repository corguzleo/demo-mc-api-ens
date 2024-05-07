/*const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://mc_evs:mc_evs@localhost:5432/demo_mc_evs_test',
    ssl: process.env.DATABASE_URL ? true : false
});
*/
const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://mc_evs:mc_evs@localhost:5432/demo_mc_evs_test';
connectionString += '?ssl=' + process.env.DATABASE_URL ? 'true' : 'false';
console.log('connectionString',connectionString);
const client = new pg.Client(connectionString);




console.log("Inicia crear BD");
client.connect();
client.query('\
CREATE TABLE IF NOT EXISTS callbacks (id SERIAL,callbackid text,verificationkey text,callbackname text NOT NULL,url text,urlforward text,signaturekey text,maxbatchsize bigint,status text,statusreason text,created_at TIMESTAMP DEFAULT NOW()); \
CREATE TABLE IF NOT EXISTS subscriptions (id SERIAL,subscriptionid text PRIMARY KEY,subscriptionname text,callbackid text NOT NULL,callbackname text,eventcategorytypes text,filters text,status text,idcallback bigint,created_at TIMESTAMP DEFAULT NOW()); \
CREATE TABLE IF NOT EXISTS events (id SERIAL PRIMARY KEY,"eventCategoryType" text,eid text,mid text,"senderType" text,"messageType" text,"channelId" text,"messageId" text,"timestampUTC" bigint,"mobileNumber" text,"contactId" text,"messageBody" text,"messageKey" text,status text,reason text,body text,callbackid text,idcallback bigint,created_at TIMESTAMP DEFAULT NOW()); \
CREATE TABLE IF NOT EXISTS dispachers_eventos (id SERIAL PRIMARY KEY,"eventCategoryType" text,eid text,mid text,"senderType" text,"messageType" text,"channelId" text,"messageId" text,"timestampUTC" bigint,"mobileNumber" text,"contactId" text,"messageBody" text,"messageKey" text,status text,reason text,body text,callbackid text,idcallback bigint,created_at TIMESTAMP DEFAULT NOW()); \
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
',(err, result) => {   
    console.log(result);
    client.end();
});


    console.log("Termina Postscript");