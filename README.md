# Event Notification Service Webhook

Esta Aplicacion recibe los eventos generados por por el Event Notification Service de Marketing Cloud y los reenvia a un dispacher si esta configurado.

## Running Locally

Make sure you have [Node.js](http://nodejs.org/) and the [Heroku CLI](https://cli.heroku.com/) installed.

```sh
$ git clone https://github.com/corguzleo/demo-mc-api-ens # or clone your own fork
$ cd demo-mc-api-ens
$ npm install
$ npm start
```

Your app should now be running on [localhost:5001](http://localhost:5001/).

## Deploying to Heroku

Using resources for this example app counts towards your usage. [Delete your app](https://devcenter.heroku.com/articles/heroku-cli-commands#heroku-apps-destroy) and [database](https://devcenter.heroku.com/articles/heroku-postgresql#removing-the-add-on) as soon as you are done experimenting to control costs.

By default, apps use Eco dynos if you are subscribed to Eco. Otherwise, it defaults to Basic dynos. The Eco dynos plan is shared across all Eco dynos in your account and is recommended if you plan on deploying many small apps to Heroku. Learn more about our low-cost plans [here](https://blog.heroku.com/new-low-cost-plans).

Eligible students can apply for platform credits through our new [Heroku for GitHub Students program](https://blog.heroku.com/github-student-developer-program).

```
$ heroku create
$ git push heroku main
$ heroku open
```
or

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## How to Use it

Before you deploy de app, you need to provide this enviroment variables
MC_SUBDOMAIN
MC_CLIENT_ID
MC_CLIENT_SECRET
MC_ACCOUNT_ID

You can view the details [here](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/ens-get-started.html)

After deploy the app you need to request(GET) '/app/db/init' to create the DB tables

The app has a menu, to start the process: 
- Click in Callbacks
- In the top of the list write a unique name for a new callback and click "Crear"
- After created the Callback, you need to send it to MC by clicking the button "Send to MC"
- When the callback is sended to MC, the next step is Verify the service by clicking the button "Verify"
- With the callback verified, you need to subscribe to the events by clicking the button "Subscription"
- Now you can check the callback events by clicking in the callback name

